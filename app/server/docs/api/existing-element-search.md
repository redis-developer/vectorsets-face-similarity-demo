# existingElementSearch

## Request

```json
POST http://localhost:3000/api/existingElementSearch
{
  "id": "e12403",
  "count": 20,
  "filterQuery": ".charCount >= 5"
}
```

| Field       | Type   | Required | Default | Description                          |
| ----------- | ------ | -------- | ------- | ------------------------------------ |
| id          | string | yes      |         | Element ID to search against         |
| count       | number | no       | 10      | Number of results (1–50)             |
| filterQuery | string | no       |         | VectorSet FILTER expression          |

## Response

```json
{
  "data": {
    "query": "VSIM 'vset:faces' ELE 'e12403' WITHSCORES WITHATTRIBS FILTER '.charCount >= 5' COUNT 20",
    "queryResults": [
      {
        "id": "e246",
        "src": "/static/faces/images/246_Tom_Hanks.jpg",
        "label": "Tom Hanks",
        "score": "0.9574",
        "meta": {
          "elementId": "e246",
          "score": "0.9574",
          "label": "Tom Hanks",
          "imagePath": "images/246_Tom_Hanks.jpg",
          "charCount": 9
        }
      }
      //...
    ]
  },
  "error": null
}
```
