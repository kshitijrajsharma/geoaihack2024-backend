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
           "start_date": "2024-12-15",
           "end_date": "2024-12-31",
           "cloud_cover": 30,
           "bbox": [45.287458864582675,15.100715276592293,45.35480955103723,15.167070639141063]
         }'
```
