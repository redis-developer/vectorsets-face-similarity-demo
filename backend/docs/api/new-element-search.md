# existingElementSearch

## Request

```json
POST http://localhost:3001/api/existingElementSearch
{
   "localImageUrl": "/Users/prasanrajpurohit/Documents/repos/redis-company/demos/vectorsets-face-similarity/database/celebrity-1000-embeddings/output/images/00096_Abhishek_Bachchan.jpg",
  "count": 20,
  "filterQuery": ".charCount >= 5"
}
```

## Response

```json
{
  "data": [
    "e97",
    "0.9975175405852497",
    "{\"label\":\"Abhishek Bachchan\",\"imagePath\":\"images/00096_Abhishek_Bachchan.jpg\",\"charCount\":17}",
    "e94",
    "0.9768812619149685",
    "{\"label\":\"Abhishek Bachchan\",\"imagePath\":\"images/00093_Abhishek_Bachchan.jpg\",\"charCount\":17}",
    "e106",
    "0.9361924380064011",
    "{\"label\":\"Abhishek Bachchan\",\"imagePath\":\"images/00105_Abhishek_Bachchan.jpg\",\"charCount\":17}",
    "e101",
    "0.9352691173553467",
    "{\"label\":\"Abhishek Bachchan\",\"imagePath\":\"images/00100_Abhishek_Bachchan.jpg\",\"charCount\":17}",
    "e95",
    "0.9342767298221588",
    "{\"label\":\"Abhishek Bachchan\",\"imagePath\":\"images/00094_Abhishek_Bachchan.jpg\",\"charCount\":17}",
    "e102",
    "0.9289107322692871",
    "{\"label\":\"Abhishek Bachchan\",\"imagePath\":\"images/00101_Abhishek_Bachchan.jpg\",\"charCount\":17}",
    "e96",
    "0.9283513352274895",
    "{\"label\":\"Abhishek Bachchan\",\"imagePath\":\"images/00095_Abhishek_Bachchan.jpg\",\"charCount\":17}",
    "e99",
    "0.9255168735980988",
    "{\"label\":\"Abhishek Bachchan\",\"imagePath\":\"images/00098_Abhishek_Bachchan.jpg\",\"charCount\":17}",
    "e104",
    "0.9250442013144493",
    "{\"label\":\"Abhishek Bachchan\",\"imagePath\":\"images/00103_Abhishek_Bachchan.jpg\",\"charCount\":17}",
    "e98",
    "0.922421857714653",
    "{\"label\":\"Abhishek Bachchan\",\"imagePath\":\"images/00097_Abhishek_Bachchan.jpg\",\"charCount\":17}",
    "e100",
    "0.9154227003455162",
    "{\"label\":\"Abhishek Bachchan\",\"imagePath\":\"images/00099_Abhishek_Bachchan.jpg\",\"charCount\":17}",
    "e105",
    "0.9144716709852219",
    "{\"label\":\"Abhishek Bachchan\",\"imagePath\":\"images/00104_Abhishek_Bachchan.jpg\",\"charCount\":17}",
    "e103",
    "0.9139987751841545",
    "{\"label\":\"Abhishek Bachchan\",\"imagePath\":\"images/00102_Abhishek_Bachchan.jpg\",\"charCount\":17}",
    "e107",
    "0.9087068885564804",
    "{\"label\":\"Abhishek Bachchan\",\"imagePath\":\"images/00106_Abhishek_Bachchan.jpg\",\"charCount\":17}",
    "e109",
    "0.8982807695865631",
    "{\"label\":\"Abhishek Bachchan\",\"imagePath\":\"images/00108_Abhishek_Bachchan.jpg\",\"charCount\":17}",
    "e108",
    "0.8474204987287521",
    "{\"label\":\"Abhishek Bachchan\",\"imagePath\":\"images/00107_Abhishek_Bachchan.jpg\",\"charCount\":17}",
    "e14992",
    "0.8171397745609283",
    "{\"label\":\"Riz Ahmed\",\"imagePath\":\"images/14991_Riz_Ahmed.jpg\",\"charCount\":9}",
    "e93",
    "0.7913097888231277",
    "{\"label\":\"Abhishek Bachchan\",\"imagePath\":\"images/00092_Abhishek_Bachchan.jpg\",\"charCount\":17}",
    "e14983",
    "0.788181260228157",
    "{\"label\":\"Riz Ahmed\",\"imagePath\":\"images/14982_Riz_Ahmed.jpg\",\"charCount\":9}",
    "e14981",
    "0.7773805111646652",
    "{\"label\":\"Riz Ahmed\",\"imagePath\":\"images/14980_Riz_Ahmed.jpg\",\"charCount\":9}"
  ],
  "error": null
}
```
