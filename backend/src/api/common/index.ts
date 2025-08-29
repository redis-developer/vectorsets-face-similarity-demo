import type { IImageDoc } from "../../types.js";

const convertVectorSetSearchResultsToObjectArr = (results?: any[]) => {
  /**
 results  = [
    'e12403',
    '1',
    '{"label":"Megan Rapinoe","imagePath":"images/12402_Megan_Rapinoe.jpg","charCount":13}',
    'e12412',
    '0.9574365168809891',
    '{"label":"Megan Rapinoe","imagePath":"images/12411_Megan_Rapinoe.jpg","charCount":13}',
  ]

  output will be
  [
    {
      elementId: 'e12403',
      score: '1',
      label: 'Megan Rapinoe',
      imagePath: 'images/12402_Megan_Rapinoe.jpg',
      charCount: 13
    },
  ]
 */
  const returnResults = [];
  if (results?.length) {
    for (let i = 0; i < results.length; i += 3) {
      const attrs = JSON.parse(results[i + 2]);
      returnResults.push({
        elementId: results[i],
        score: results[i + 1],
        ...attrs,
      });
    }
  }
  return returnResults;
};

const formatImageResults = (results: any[], imagePrefix: string) => {
  const formattedResults: IImageDoc[] = [];

  if (results && results.length > 0) {
    for (let res of results) {
      formattedResults.push({
        id: res.elementId,
        src: `${imagePrefix}${res.imagePath}`,
        label: res.label,
      });
    }
  }
  return formattedResults;
};

export { formatImageResults, convertVectorSetSearchResultsToObjectArr };
