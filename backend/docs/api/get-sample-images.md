# existingElementSearch

## Request

```json
POST http://localhost:3001/api/getSampleImages
{
      "datasetName": "VSET_CELEB"
}
```

## Response

```json
{
  "data": [
    {
      "id": "e17882",
      "src": "/static/celebs/images/17881_Yvonne_Strahovski.jpg",
      "label": "Yvonne Strahovski",
      "meta": {
        "label": "Yvonne Strahovski",
        "imagePath": "images/17881_Yvonne_Strahovski.jpg",
        "charCount": 17,
        "elementId": "e17882"
      }
    },
    {
      "id": "e7047",
      "src": "/static/celebs/images/07046_James_Marsden.jpg",
      "label": "James Marsden",
      "meta": {
        "label": "James Marsden",
        "imagePath": "images/07046_James_Marsden.jpg",
        "charCount": 13,
        "elementId": "e7047"
      }
    }
    //...
  ],
  "error": null
}
```
