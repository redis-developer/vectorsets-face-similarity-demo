# existingElementSearch

## Request

```json
POST http://localhost:3001/api/existingElementSearch
{
  "id": "e1",
  "count": 20,
  "filterQuery": ".charCount >= 5",
  "datasetName": "VSET_CELEB"
}
```

## Response

```json
{
  "data": [
    "e1",
    "0.9998789253513678",
    "{\"label\":\"Aaron Eckhart\",\"imagePath\":\"images/00000_Aaron_Eckhart.jpg\",\"charCount\":13}",
    "e17",
    "0.9463608115911484",
    "{\"label\":\"Aaron Eckhart\",\"imagePath\":\"images/00016_Aaron_Eckhart.jpg\",\"charCount\":13}",
    "e10",
    "0.9391105808317661",
    "{\"label\":\"Aaron Eckhart\",\"imagePath\":\"images/00009_Aaron_Eckhart.jpg\",\"charCount\":13}",
    "e8",
    "0.9353705793619156",
    "{\"label\":\"Aaron Eckhart\",\"imagePath\":\"images/00007_Aaron_Eckhart.jpg\",\"charCount\":13}"
    //...
  ],
  "error": null
}
```
