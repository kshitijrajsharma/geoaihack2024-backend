import { Map } from "maplibre-gl";
import { useEffect } from "react";
import { PREDICTIONS_GEOJSON } from "./utils/predictions";
import { COUNTRY_CODES_JSON } from "./utils/country_codes";
import bbox from "@turf/bbox";


const PREDICTIONS_GEOJSON_SOURCE = 'predictions-source';
const PREDICTIONS_GEOJSON_LAYER = 'predictions-layer';


export const PredictionsLayer = ({ map, selectedCountry }: { map: Map | null, selectedCountry: string }) => {

    useEffect(() => {
        if (!map) return
        if (!map.getSource(PREDICTIONS_GEOJSON_SOURCE)) {
            map.addSource(PREDICTIONS_GEOJSON_SOURCE, {
                type: 'geojson',
                data: PREDICTIONS_GEOJSON
            })
        }
        if (!map.getLayer(PREDICTIONS_GEOJSON_LAYER)) {
            map.addLayer({
                id: PREDICTIONS_GEOJSON_LAYER,
                source: PREDICTIONS_GEOJSON_SOURCE,
                type: 'circle',
                paint: {
                    "circle-color": 'red'
                },
            })
        }
    }, [map])

    useEffect(() => {
        if (!map || !selectedCountry) return

        if (selectedCountry === 'All') {
            map.fitBounds(bbox(PREDICTIONS_GEOJSON) as [number, number, number, number], { padding: 20 });
            map.getSource(PREDICTIONS_GEOJSON_SOURCE)?.setData(PREDICTIONS_GEOJSON);

        } else {
            const tileCodes = COUNTRY_CODES_JSON[selectedCountry] || [];
            const filteredFeatures = {
                ...PREDICTIONS_GEOJSON,
                features: PREDICTIONS_GEOJSON.features.filter((feature) =>
                    tileCodes.includes(feature.properties.mgrs_tile_id)
                )
            };
            map.fitBounds(bbox(filteredFeatures) as [number, number, number, number], { padding: 20 });
            map.getSource(PREDICTIONS_GEOJSON_SOURCE)?.setData(filteredFeatures);
        }

    }, [map, selectedCountry])

    return null
}



const PREDICTIONS_RASTER_SOURCE = 'predictions-source';
const PREDICTIONS_RASTER_LAYER = 'predictions-layer';


export const GeoTiffLayers = ({ map, url }: { map: Map | null, url: string }) => {

    useEffect(() => {
        if (!map) return
        if (!map.getSource(PREDICTIONS_RASTER_SOURCE)) {
            map.addSource(PREDICTIONS_RASTER_SOURCE, {
                type: 'raster',
                url: `cog://${url}`,
            })
        }
        if (!map.getLayer(PREDICTIONS_RASTER_LAYER)) {
            map.addLayer({
                id: PREDICTIONS_RASTER_LAYER,
                source: PREDICTIONS_RASTER_SOURCE,
                type: 'raster'
            })
        }
    }, [map, url])

    return null
}

export const GOOGLE_SATELLITE_BASEMAP_SOURCE = 'google-satellite';
export const GOOGLE_SATELLITE_BASEMAP_LAYER = 'google-satellite-layer';

export const GoogleBasemapLayer = ({ map }: { map: Map | null }) => {

    useEffect(() => {
        if (!map) return
        if (!map.getSource(GOOGLE_SATELLITE_BASEMAP_SOURCE)) {
            map.addSource(GOOGLE_SATELLITE_BASEMAP_SOURCE,
                {
                    type: "raster",
                    tiles: [
                        "https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
                        "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
                        "https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
                        "https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
                    ],
                    attribution: "&copy; Google",
                    tileSize: 256,
                },)
        }
        if (!map.getLayer(GOOGLE_SATELLITE_BASEMAP_LAYER)) {
            map.addLayer(
                {
                    id: GOOGLE_SATELLITE_BASEMAP_LAYER,
                    type: "raster",
                    source: GOOGLE_SATELLITE_BASEMAP_SOURCE,
                    layout: { visibility: "none" },
                    minzoom: 0,
                    maxzoom: 22,
                },)
        }
    }, [map])

    return null;
};