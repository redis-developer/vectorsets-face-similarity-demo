import type { InputField } from "@/components/MainPanel/SearchBar/SearchBar";

const celebInputFields: InputField[] = [
  {
    label: "Name Length >=",
    name: "charCount",
    type: "number",
    typeOptions: {
      min: 0,
      max: 50,
      step: 1,
      placeholder: "Enter char count",
    },
  },
];

const celebMetaDisplayFields: Record<string, string> = {
  elementId: "ID",
  charCount: "CharCount",
};

const tmdbInputFields: InputField[] = [
  {
    label: "Country",
    name: "country",
    type: "select",
    typeOptions: {
      options: [
        { label: "AMERICA", value: "AMERICA" },
        { label: "AUSTRALIA", value: "AUSTRALIA" },
        { label: "BRAZIL", value: "BRAZIL" },
        { label: "CANADA", value: "CANADA" },
        { label: "CHINA", value: "CHINA" },
        { label: "ENGLAND", value: "ENGLAND" },
        { label: "FRANCE", value: "FRANCE" },
        { label: "INDIA", value: "INDIA" },
        { label: "ISRAEL", value: "ISRAEL" },
        { label: "ITALY", value: "ITALY" },
        { label: "UK", value: "UK" },
      ],
      // placeholder: "",
    },
  },
  {
    label: "Popularity >=",
    name: "popularity",
    type: "number",
    typeOptions: {
      min: 0,
      max: 300,
      step: 1,
      placeholder: "Enter popularity",
    },
  },
  {
    label: "Name Length >=",
    name: "charCount",
    type: "number",
    typeOptions: {
      min: 0,
      max: 50,
      step: 1,
      placeholder: "Enter char count",
    },
  },
];

const tmdbMetaDisplayFields: Record<string, string> = {
  elementId: "ID",
  label: "Name",
  country: "Country",
  popularity: "Popularity",
  charCount: "CharCount",
};

const DATASET_NAMES = {
  VSET_CELEB: "VSET_CELEB",
  VSET_TMDB: "VSET_TMDB",
} as const;

const DATASETS_FILTERS = {
  VSET_CELEB: {
    inputFields: celebInputFields,
    metaDisplayFields: celebMetaDisplayFields,
  },
  VSET_TMDB: {
    inputFields: tmdbInputFields,
    metaDisplayFields: tmdbMetaDisplayFields,
  },
} as const;

export { DATASET_NAMES, DATASETS_FILTERS };
