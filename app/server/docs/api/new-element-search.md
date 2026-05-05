# newElementSearch

## Request

```json
POST http://localhost:3000/api/newElementSearch
{
  "localImageUrl": "/uploads/1af01e61899bf801.jpg",
  "count": 20,
  "filterQuery": ".charCount >= 10"
}
```

| Field          | Type   | Required | Default | Description                          |
| -------------- | ------ | -------- | ------- | ------------------------------------ |
| localImageUrl  | string | yes      |         | Path to the uploaded image           |
| count          | number | no       | 10      | Number of results (1–50)             |
| filterQuery    | string | no       |         | VectorSet FILTER expression          |

## Response

```json
{
  "data": {
    "query": "VSIM 'vset:faces' VALUES 3072 -0.0424742969... WITHSCORES WITHATTRIBS FILTER '.charCount >= 10' COUNT 20",
    "queryResults": [
      {
        "id": "e12403",
        "src": "/static/faces/images/12402_Megan_Rapinoe.jpg",
        "label": "Megan Rapinoe",
        "score": "0.7865",
        "meta": {
          "elementId": "e12403",
          "score": "0.7865",
          "label": "Megan Rapinoe",
          "imagePath": "images/12402_Megan_Rapinoe.jpg",
          "charCount": 13
        }
      }
      //...
    ]
  },
  "error": null
}
```
