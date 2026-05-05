# getSampleImages

## Request

```json
POST http://localhost:3000/api/getSampleImages
{}
```

## Response

Returns up to 100 random images from the vector set.

```json
{
  "data": [
    {
      "id": "e7047",
      "src": "/static/faces/images/7046_James_Marsden.jpg",
      "label": "James Marsden",
      "meta": {
        "label": "James Marsden",
        "imagePath": "images/7046_James_Marsden.jpg",
        "charCount": 13,
        "elementId": "e7047"
      }
    }
    //...
  ],
  "error": null
}
```
