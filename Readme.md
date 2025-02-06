## Working dir 

Challenge : https://github.com/kshitijrajsharma/geoaihack2024.git 

Kaggle Link : https://www.kaggle.com/competitions/geo-ai-hack/

### Objective : 
Identify the potential  locust breeding grounds 

### Data : 




## Backend for geoaihack 



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
