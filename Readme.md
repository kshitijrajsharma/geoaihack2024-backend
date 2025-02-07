## Working dir for GeoAIhack 2025

Challenge : https://geoaihack.com/ 

Kaggle Link : https://www.kaggle.com/competitions/geo-ai-hack/

Demo Video : https://www.youtube.com/watch?v=scP9Xd8NUqY 

Slides : Click [Here](https://raw.githubusercontent.com/kshitijrajsharma/geoaihack2025/refs/heads/main/slides.pdf)

### Objective : 
Identify the potential  locust breeding grounds 


### Team : GeoTechAI

- Omowonuola Akintola - Copernicus Masters in Digital Earth (Geo Data Science & AI4 EO), Paris Lodron University of Salzburg
- Emmanuel Jolaiya - Master of Science in Geospatial Technologies, Universitat Jaume I (UJI), Castellón, Dept. Lenguajes y Sistemas Informaticos (LSI), Castellón, Spain.
- Kshitij Sharma - Student at Copernicus Masters in Digital Earth (Geo Data Science & AI4 EO), Paris Lodron University of Salzburg , Developer at HOTOSM 
- Ayomide Oraegbu - Master of Science in Geospatial Technologies, Universitat Jaume I (UJI), Castellón, Dept. Lenguajes y Sistemas Informaticos (LSI), Castellón, Spain.


### Data : 

It is comprehensive dataset of ground-truth locust observations obtained from the UN FAO Locust Hub (downloaded on March 17, 2022). The dataset covers observations from 1985 to 2021 and includes detailed information on locust life stages (Hoppers, Bands, Adults, and Swarms) as well as ecological conditions. These locust observations have been processed with guidance from experts to extract observations for solitarious locusts breeding and non-breeding grounds.

 This data contains 6 spectral bands (Blue(1), Green(2), Red(3), NIR Narrow(4), SWIR1(5), SWIR2(6))

To align with the availability of satellite imagery, the dataset has been processed to focus on the period from 2016 to 2021, resulting in 42,453 observations. This subset has been further divided into:

    Training set: Observations from 2016–2020
    Test set: Observations for 2021

Using the locust observations as ground-truth labels, we collect multispectral features from satellites through InstaGeo’s Data Pipeline, which offers seamless access to the following modalities:

    Harmonized Landsat and Sentinel-2 (HLS) multispectral data (NASA/USGS)

Command used to generate HLS dataset
python -m "instageo.data.chip_creator" --dataframe_path="train.csv" --output_directory="train" --min_count=1 --chip_size=256 --temporal_tolerance=3 --temporal_step=30 --num_steps=3 --masking_strategy=any --mask_types=water,cloud --data_source=HLS --window_size=3 --processing_method=cog

    Sentinel-2 multispectral data (European Space Agency - ESA)

Command used to generate Sentinel-2 dataset
python -m "instageo.data.chip_creator" --dataframe_path="train.csv" --output_directory="train" --min_count=1 --chip_size=256 --temporal_tolerance=7 --temporal_step=30 --num_steps=3 --masking_strategy=any --mask_types=water,cloud --data_source=HLS --window_size=1 --cloud_coverage=50 --processing_method=cog

The outputs of InstaGeo data pipeline include:

    Chips: 3 x 6 x 256 x 256 arrays (Number of steps X Number of Satellite Data Bands X Height, Width).
    Although, in the Tiff file for the chips it is stored as 18 x 256 x 256: the first two dimensions have been combined into one.
    Segmentation maps: 256 x 256 arrays where each pixel is assigned the value of the ground-truth observation retrieved from FAO Locust Hub



## Run this Backend 


### Run 

```bash
uvicorn API:app --host 127.0.0.1 --port 8000
```

### Test 


```bash
curl -X POST "http://127.0.0.1:8000/process" \
     -H "Content-Type: application/json" \
     -d '{
           "start_date": "2025-01-15"
           "end_date": "2025-01-31",
           "cloud_cover": 30,
           "bbox": [45.287458864582675,15.100715276592293,45.35480955103723,15.167070639141063]
         }'
```


### Result : 
![image](https://github.com/user-attachments/assets/6eb815a2-0952-42a3-9882-ffa7deb144bb)


**And we won second place in the hackathon , Hurray !!!**
![image](https://github.com/user-attachments/assets/5b8b3892-90bc-49e8-9a0c-22fc49ec6470)

