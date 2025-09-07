# existingElementSearch

## Request

```json
POST http://localhost:3001/api/existingElementSearch
{
   "localImageUrl": "/static/celebs/images/00000_Aaron_Eckhart.jpg",
  // "localImageUrl": "http://localhost:3001/api/uploads/1af01e61899bf801.jpg",
  "count": 20,
  "filterQuery": ".charCount >= 20",
   "datasetName": "VSET_TMDB"
}
```

## Response

```json
{
  "data": {
    "query": "VSIM 'vset:tmdb' VALUES 768 -0.0424742969290927 -0.005981843504972895 0.023023464722456134... WITHSCORES WITHATTRIBS FILTER '.charCount >= 20' COUNT 20",
    "queryResults": [
      {
        "id": "e10011",
        "src": "/static/tmdb/images/010010_Aadhira_Pandilakshmi.jpg",
        "label": "Aadhira Pandilakshmi",
        "score": "0.7865",
        "meta": {
          "elementId": "e10011",
          "score": "0.7865",
          "label": "Aadhira Pandilakshmi",
          "imagePath": "images/010010_Aadhira_Pandilakshmi.jpg",
          "charCount": 20,
          "imdbId": "nm5975306",
          "department": "Acting",
          "placeOfBirth": "Chennai, Tamilnadu,  India",
          "popularity": 6.268,
          "country": "INDIA"
        }
      },
      {
        "id": "e247",
        "src": "/static/tmdb/images/000246_Vineeth_Radhakrishnan.jpg",
        "label": "Vineeth Radhakrishnan",
        "score": "0.7695",
        "meta": {
          "elementId": "e247",
          "score": "0.7695",
          "label": "Vineeth Radhakrishnan",
          "imagePath": "images/000246_Vineeth_Radhakrishnan.jpg",
          "charCount": 21,
          "imdbId": "nm0898913",
          "department": "Acting",
          "placeOfBirth": "Kannur, Kerala, India",
          "popularity": 31.67,
          "country": "INDIA"
        }
      },
      {
        "id": "e8753",
        "src": "/static/tmdb/images/008752_Charlie_Chin_Chiang-Lin.jpg",
        "label": "Charlie Chin Chiang-Lin",
        "score": "0.7509",
        "meta": {
          "elementId": "e8753",
          "score": "0.7509",
          "label": "Charlie Chin Chiang-Lin",
          "imagePath": "images/008752_Charlie_Chin_Chiang-Lin.jpg",
          "charCount": 23,
          "imdbId": "nm0156875",
          "department": "Acting",
          "placeOfBirth": "Nanjing, Jiangsu, China",
          "popularity": 6.752,
          "country": "CHINA"
        }
      }
      //...
    ]
  },
  "error": null
}
```
