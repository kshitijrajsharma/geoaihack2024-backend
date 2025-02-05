import csv
import os
import re
import shutil
import subprocess
from datetime import datetime

import mercantile
import numpy as np
import rasterio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pyproj import Transformer
from rasterio.merge import merge
from rasterio.transform import from_bounds
from rio_cogeo.cogeo import cog_translate
from rio_cogeo.profiles import cog_profiles
from rio_tiler.io import COGReader
from tqdm import tqdm
from vcube.extract import ExtractProcessor

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WORK_DIR = "./static"
OUTPUT_DIR = f"{WORK_DIR}/sentinel_images"
TILE_DIR = f"{OUTPUT_DIR}/stacked_tiles"
PREDICTION_DIR = f"{OUTPUT_DIR}/predictions"
COG_OUTPUT_PATH = f"{PREDICTION_DIR}/predictions_cog.tif"
CHECKPOINT_PATH = "instageo_best_checkpoint.ckpt"
ZOOM_LEVEL = 12

os.makedirs(WORK_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TILE_DIR, exist_ok=True)
os.makedirs(PREDICTION_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=WORK_DIR), name="static")


class ProcessRequest(BaseModel):
    start_date: str
    end_date: str
    cloud_cover: int
    bbox: list[float]


@app.post("/process")
def process_data(request: ProcessRequest):
    try:
        print("[INFO] Extracting Sentinel-2 images...")
        if os.path.exists(OUTPUT_DIR):
            shutil.rmtree(OUTPUT_DIR)

        try:
            extractor = ExtractProcessor(
                request.bbox,
                request.start_date,
                request.end_date,
                request.cloud_cover,
                ["blue", "green", "red", "nir", "swir16", "swir22"],
                OUTPUT_DIR,
                workers=2,
            )
            extractor.extract()
        except Exception as e:
            raise HTTPException(status_code=404, detail="Couldn't fetch images")
        if count_tif_files(OUTPUT_DIR) < 3:
            raise HTTPException(status_code=404, detail="Less than 3 images found")
        print("[INFO] Stacking latest images...")
        stacked_tif = f"{OUTPUT_DIR}/stacked.tif"
        stack_latest_images(OUTPUT_DIR, stacked_tif)

        print("[INFO] Extracting tiles from stacked image...")
        extract_tile(f"{OUTPUT_DIR}/stacked.tif", TILE_DIR, ZOOM_LEVEL)

        print("[INFO] Generating CSV for inference...")
        prediction_csv = f"{OUTPUT_DIR}/run_prediction.csv"
        create_prediction_csv_list(TILE_DIR, prediction_csv)

        print("[INFO] Running inference...")
        run_inference(prediction_csv, PREDICTION_DIR, CHECKPOINT_PATH)

        print("[INFO] Merging tiles to COG...")
        merge_tiles_to_cog(PREDICTION_DIR, COG_OUTPUT_PATH)

        return {
            "status": "success",
            "prediction_cog": f"/static/sentinel_images/predictions/predictions_cog.tif",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def stack_latest_images(input_dir, output_tif):
    tif_files = [f for f in os.listdir(input_dir) if f.endswith(".tif")]
    date_pattern = re.compile(r"(\d{8})")

    def extract_date(filename):
        match = date_pattern.search(filename)
        return datetime.strptime(match.group(1), "%Y%m%d") if match else None

    tif_files_with_dates = sorted(
        [(f, extract_date(f)) for f in tif_files], key=lambda x: x[1], reverse=True
    )

    latest_three_files = [
        os.path.join(input_dir, f[0]) for f in tif_files_with_dates[:3]
    ]
    if len(latest_three_files) < 3:
        raise ValueError("Not enough images to stack. Need at least 3 images.")

    stacked_bands = []
    meta = None

    for tif_file in latest_three_files:
        with rasterio.open(tif_file) as src:
            if meta is None:
                meta = src.meta.copy()
                meta.update(count=src.count * 3)
            for i in range(1, src.count + 1):
                stacked_bands.append(src.read(i))

    stacked_bands = np.stack(stacked_bands, axis=0)

    with rasterio.open(output_tif, "w", **meta) as dst:
        for i in range(1, stacked_bands.shape[0] + 1):
            dst.write(stacked_bands[i - 1], i)


def extract_tile(input_tif, tile_dir, zoom_level):
    os.makedirs(tile_dir, exist_ok=True)
    with COGReader(input_tif) as cog:
        bounds = cog.bounds
        transformer_to_wgs84 = Transformer.from_crs(
            cog.crs, "EPSG:4326", always_xy=True
        )
        transformer_to_cog_crs = Transformer.from_crs(
            "EPSG:4326", cog.crs, always_xy=True
        )

        min_lon, min_lat = transformer_to_wgs84.transform(bounds[0], bounds[1])
        max_lon, max_lat = transformer_to_wgs84.transform(bounds[2], bounds[3])
        tiles = list(mercantile.tiles(min_lon, min_lat, max_lon, max_lat, zoom_level))

        for tile in tqdm(tiles, desc="Extracting tiles"):
            tile_data, _ = cog.tile(tile.x, tile.y, tile.z)
            tile_bounds = mercantile.bounds(tile)
            tile_bounds_cog_crs = transformer_to_cog_crs.transform_bounds(
                tile_bounds.west, tile_bounds.south, tile_bounds.east, tile_bounds.north
            )
            tile_transform = from_bounds(
                tile_bounds_cog_crs[0],
                tile_bounds_cog_crs[1],
                tile_bounds_cog_crs[2],
                tile_bounds_cog_crs[3],
                256,
                256,
            )

            tile_filename = os.path.join(
                tile_dir,
                f"{os.path.basename(input_tif).split('.')[0]}_{tile.x}_{tile.y}.tif",
            )
            with rasterio.open(input_tif) as src:
                meta = src.meta.copy()
                meta.update(
                    {
                        "driver": "GTiff",
                        "height": 256,
                        "width": 256,
                        "count": tile_data.shape[0],
                        "dtype": tile_data.dtype,
                        "transform": tile_transform,
                        "crs": src.crs,
                    }
                )

                with rasterio.open(tile_filename, "w", **meta) as dst:
                    for i in range(1, tile_data.shape[0] + 1):
                        dst.write(tile_data[i - 1], i)


def create_prediction_csv_list(input_dir, output_csv):
    tiff_files = [f for f in os.listdir(input_dir) if f.endswith(".tif")]
    with open(output_csv, "w", newline="") as csvfile:
        csvwriter = csv.writer(csvfile)
        csvwriter.writerow(["Input"])
        for tiff_file in tiff_files:
            csvwriter.writerow([os.path.join(input_dir, tiff_file)])


def run_inference(prediction_csv, output_dir, checkpoint_path):
    command = [
        "python",
        "-m",
        "instageo.model.run",
        "--config-name=locust",
        f"root_dir=.",
        f"test_filepath={prediction_csv}",
        "train.batch_size=16",
        f"checkpoint_path={checkpoint_path}",
        f"output_dir={output_dir}",
        "mode=chip_inference",
    ]
    subprocess.run(command, check=True)


def merge_tiles_to_cog(input_dir, output_cog):
    tiff_files = [
        os.path.join(input_dir, f) for f in os.listdir(input_dir) if f.endswith(".tif")
    ]

    src_files_to_mosaic = [rasterio.open(fp) for fp in tiff_files]
    mosaic, out_trans = merge(src_files_to_mosaic)

    out_meta = src_files_to_mosaic[0].meta.copy()
    out_meta.update(
        {
            "driver": "GTiff",
            "height": mosaic.shape[1],
            "width": mosaic.shape[2],
            "transform": out_trans,
            "count": mosaic.shape[0],
        }
    )

    temp_merged_tif = os.path.join(input_dir, "merged_temp.tif")
    with rasterio.open(temp_merged_tif, "w", **out_meta) as dataset:
        for i in range(1, mosaic.shape[0] + 1):
            dataset.write(mosaic[i - 1], i)

    cog_translate(temp_merged_tif, output_cog, cog_profiles.get("deflate"))
    os.remove(temp_merged_tif)


def count_tif_files(input_dir: str) -> int:
    if not os.path.isdir(input_dir):
        raise ValueError(f"Invalid directory: {input_dir}")

    tif_files = [f for f in os.listdir(input_dir) if f.lower().endswith(".tif")]
    return len(tif_files)
