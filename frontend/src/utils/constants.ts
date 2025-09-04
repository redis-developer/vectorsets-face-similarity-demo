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
      placeholder: "Enter length",
    },
  },
];

const celebMetaDisplayFields: Record<string, string> = {
  elementId: "ID",
  label: "Name",
  charCount: "NameLength",
};

const tmdbInputFields: InputField[] = [
  {
    label: "Country",
    name: "country",
    type: "select",
    typeOptions: {
      options: [
        { label: "UNITED_STATES", value: "UNITED_STATES" },
        { label: "INDIA", value: "INDIA" },
        { label: "UNITED_KINGDOM", value: "UNITED_KINGDOM" },
        { label: "ISRAEL", value: "ISRAEL" },
        { label: "CHINA", value: "CHINA" },
        { label: "JAPAN", value: "JAPAN" },
        { label: "FRANCE", value: "FRANCE" },
        { label: "GERMANY", value: "GERMANY" },
        { label: "ITALY", value: "ITALY" },
        { label: "SPAIN", value: "SPAIN" },
        { label: "SOUTH_KOREA", value: "SOUTH_KOREA" },
        { label: "CANADA", value: "CANADA" },
        { label: "AUSTRALIA", value: "AUSTRALIA" },
        { label: "BRAZIL", value: "BRAZIL" },
        { label: "MEXICO", value: "MEXICO" },
        { label: "RUSSIA", value: "RUSSIA" },
        { label: "SWEDEN", value: "SWEDEN" },
        { label: "NETHERLANDS", value: "NETHERLANDS" },
        { label: "ARGENTINA", value: "ARGENTINA" },
        { label: "HONG_KONG", value: "HONG_KONG" },
        { label: "TURKEY", value: "TURKEY" },
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
      placeholder: "Enter length",
    },
  },
];

const tmdbMetaDisplayFields: Record<string, string> = {
  elementId: "ID",
  label: "Name",
  country: "Country",
  popularity: "Popularity",
  charCount: "NameLength",
};

const DATASET_NAMES = {
  VSET_CELEB: "VSET_CELEB",
  VSET_TMDB: "VSET_TMDB",
} as const;

type DatasetNameType = (typeof DATASET_NAMES)[keyof typeof DATASET_NAMES];

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

interface IServerConfig {
  currentDataset: DatasetNameType;
}
type IClientConfig = IServerConfig;

export { DATASET_NAMES, DATASETS_FILTERS };

export type { DatasetNameType, IClientConfig, IServerConfig };
