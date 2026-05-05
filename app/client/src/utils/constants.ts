import type { InputField } from '../components/MainPanel/SearchBar/SearchBar';

/**
 // vset:faces attributes
 {
 "elementId":"",
 "label":"Angeli Khang",
 "imagePath":"images/000000_Angeli_Khang.jpg",
 "charCount":12,
 "imdbId":"nm13112435",
 "department":"Acting",
 "placeOfBirth":"Santa Cruz del Norte, Cuba",
 "popularity":207.229,
 "country":"PHILIPPINES"
 }
 */

const FILTER_INPUT_FIELDS: InputField[] = [
  {
    label: 'Country',
    name: 'country',
    type: 'select',
    typeOptions: {
      options: [
        { label: 'United States', value: 'UNITED_STATES' },
        { label: 'India', value: 'INDIA' },
        { label: 'United Kingdom', value: 'UNITED_KINGDOM' },
        { label: 'Israel', value: 'ISRAEL' },
        { label: 'China', value: 'CHINA' },
        { label: 'Japan', value: 'JAPAN' },
        { label: 'France', value: 'FRANCE' },
        { label: 'Germany', value: 'GERMANY' },
        { label: 'Italy', value: 'ITALY' },
        { label: 'Spain', value: 'SPAIN' },
        { label: 'South Korea', value: 'SOUTH_KOREA' },
        { label: 'Canada', value: 'CANADA' },
        { label: 'Australia', value: 'AUSTRALIA' },
        { label: 'Brazil', value: 'BRAZIL' },
        { label: 'Mexico', value: 'MEXICO' },
        { label: 'Russia', value: 'RUSSIA' },
        { label: 'Sweden', value: 'SWEDEN' },
        { label: 'Netherlands', value: 'NETHERLANDS' },
        { label: 'Argentina', value: 'ARGENTINA' },
        { label: 'Hong Kong', value: 'HONG_KONG' },
        { label: 'Turkey', value: 'TURKEY' },
      ],
    },
  },
  {
    label: 'Popularity >=',
    name: 'popularity',
    type: 'slider',
    typeOptions: {
      min: 0,
      max: 210,
      step: 10,
    },
  },
  // {
  //   label: 'Name length >=',
  //   name: 'charCount',
  //   type: 'number',
  //   typeOptions: {
  //     min: 0,
  //     max: 50,
  //     step: 1,
  //     placeholder: 'Enter length',
  //   },
  // },
];

const META_DISPLAY_FIELDS: Record<string, string> = {
  elementId: 'ID',
  label: 'Name',
  country: 'Country',
  popularity: 'Popularity',
  charCount: 'Name length',
};

interface ServerConfig {
  basePath: string;
}

export { FILTER_INPUT_FIELDS, META_DISPLAY_FIELDS };

export type { ServerConfig };
