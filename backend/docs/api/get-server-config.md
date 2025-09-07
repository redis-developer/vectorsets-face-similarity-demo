# existingElementSearch

## Request

```json
POST http://localhost:3001/api/getServerConfig
{

}
```

## Response

```json
{
  "data": {
    "currentDataset": "VSET_CELEB",
    "datasets": [
      {
        "label": "Celebrity 1000",
        "value": "VSET_CELEB"
      },
      {
        "label": "TMDB 10k",
        "value": "VSET_TMDB"
      }
    ]
  },
  "error": null
}
```
