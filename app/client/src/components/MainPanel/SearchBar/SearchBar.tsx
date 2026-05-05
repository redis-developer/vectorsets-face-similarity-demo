import type { SearchFormData } from '../../../types';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './SearchBar.module.scss';
import { useAppContext } from '../../../contexts/AppContext';
import { Slider } from '../../shared/Slider/Slider';

export interface NumberTypeOptions {
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export interface SliderTypeOptions {
  min: number;
  max: number;
  step?: number;
}

export interface SelectTypeOptions {
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
}

export interface TextTypeOptions {
  placeholder?: string;
}

export type TypeOptions =
  | NumberTypeOptions
  | SliderTypeOptions
  | SelectTypeOptions
  | TextTypeOptions;

export interface InputField {
  label: string;
  name: string;
  type: 'number' | 'slider' | 'select' | 'text';
  typeOptions: TypeOptions;
  width?: string;
}

interface SearchBarProps {
  inputFields: InputField[];
  onSearch: (data: SearchFormData) => void;
  onClear?: () => void;
  rowConfig?: number[]; // New prop for row configuration
  mode?: 'manual' | 'auto'; // New prop for search mode
  labelPosition?: 'top' | 'left' | 'placeholder'; // New prop for label position
}

const MAX_FIELDS_PER_ROW = 3;

/**
 * Splits input fields into rows based on rowConfig or default configuration
 * @param inputFields - Array of input fields to split
 * @param rowConfig - Optional array specifying fields per row (e.g., [2, 2, 2])
 * @returns Array of field rows
 */
const splitFieldsIntoRows = (
  inputFields: InputField[],
  rowConfig?: number[],
): InputField[][] => {
  const fieldRows: InputField[][] = [];
  let fieldIndex = 0;

  if (rowConfig) {
    // Use rowConfig to determine fields per row for specified rows
    for (const fieldsInRow of rowConfig) {
      if (fieldIndex < inputFields.length) {
        fieldRows.push(inputFields.slice(fieldIndex, fieldIndex + fieldsInRow));
        fieldIndex += fieldsInRow;
      }
    }
    // For remaining fields, use MAX_FIELDS_PER_ROW
    while (fieldIndex < inputFields.length) {
      fieldRows.push(
        inputFields.slice(fieldIndex, fieldIndex + MAX_FIELDS_PER_ROW),
      );
      fieldIndex += MAX_FIELDS_PER_ROW;
    }
  } else {
    // Default: 3 fields per row
    for (let i = 0; i < inputFields.length; i += MAX_FIELDS_PER_ROW) {
      fieldRows.push(inputFields.slice(i, i + MAX_FIELDS_PER_ROW));
    }
  }

  return fieldRows;
};

const SearchBar: React.FC<SearchBarProps> = ({
  inputFields,
  onSearch,
  onClear,
  rowConfig,
  mode = 'manual',
  labelPosition = 'top',
}) => {
  const { searchFormData, setSearchFormData } = useAppContext();

  const handleInputChange = (fieldName: string, value: string | number) => {
    const newFormData: SearchFormData = {
      ...searchFormData,
      [fieldName]: value,
    };
    setSearchFormData(newFormData);

    // Auto-search if mode is 'auto'
    if (mode === 'auto') {
      setTimeout(() => {
        onSearch(newFormData);
      }, 300);
    }
  };

  const handleSliderDrag = (fieldName: string, value: number) => {
    setSearchFormData({ ...searchFormData, [fieldName]: value });
  };

  const handleSliderCommit = (fieldName: string, value: number) => {
    const newFormData: SearchFormData = {
      ...searchFormData,
      [fieldName]: value,
    };
    setSearchFormData(newFormData);
    onSearch(newFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchFormData);
  };

  const handleClear = () => {
    setSearchFormData({});
    onClear?.();

    // Auto-search with empty data if mode is 'auto'
    if (mode === 'auto') {
      onSearch({});
    }
  };

  // Split inputFields into rows using the utility function
  const fieldRows = splitFieldsIntoRows(inputFields, rowConfig);

  const renderInputField = (field: InputField) => {
    const fieldName = field.name;
    const useLabelAsPlaceholder = labelPosition === 'placeholder';

    switch (field.type) {
      case 'number': {
        const options = field.typeOptions as NumberTypeOptions;
        return (
          <input
            id={`search-field-${fieldName}`}
            name={fieldName}
            type="number"
            min={options.min}
            max={options.max}
            step={options.step}
            placeholder={useLabelAsPlaceholder ? field.label : options.placeholder}
            value={searchFormData[fieldName] || ''}
            onChange={(e) =>
              handleInputChange(fieldName, Number(e.target.value))
            }
            className={styles.input}
          />
        );
      }

      case 'select': {
        const options = field.typeOptions as SelectTypeOptions;
        return (
          <div className={styles.selectWrapper}>
            <select
              id={`search-field-${fieldName}`}
              name={fieldName}
              value={searchFormData[fieldName] || ''}
              onChange={(e) => handleInputChange(fieldName, e.target.value)}
              className={styles.select}
            >
              <option value="">
                {useLabelAsPlaceholder ? field.label : (options.placeholder || `Select ${field.label}`)}
              </option>
              {options.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className={styles.selectIcon} />
          </div>
        );
      }

      case 'slider': {
        const options = field.typeOptions as SliderTypeOptions;
        return (
          <Slider
            label={field.label}
            name={fieldName}
            min={options.min}
            max={options.max}
            step={options.step}
            value={Number(searchFormData[fieldName]) || options.min}
            onChange={handleSliderDrag}
            onChangeEnd={handleSliderCommit}
          />
        );
      }

      case 'text': {
        const options = field.typeOptions as TextTypeOptions;
        return (
          <input
            id={`search-field-${fieldName}`}
            name={fieldName}
            type="text"
            placeholder={useLabelAsPlaceholder ? field.label : options.placeholder}
            value={searchFormData[fieldName] || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            className={styles.input}
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className={styles.searchBar}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.fieldsContainer}>
          {fieldRows.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.row}>
              {row.map((field) => (
                <div
                  key={field.label}
                  className={styles.fieldGroup}
                  style={field.width ? { width: field.width } : undefined}
                  data-width={field.width ? 'true' : undefined}
                  data-label-position={labelPosition}
                >
                  {labelPosition !== 'placeholder' && (
                    <label className={styles.label}>{field.label}</label>
                  )}
                  {renderInputField(field)}
                </div>
              ))}
            </div>
          ))}
        </div>

        {mode === 'manual' && (
          <div className={styles.actions}>
            <button type="submit" className={styles.searchButton}>
              Search
            </button>
            <button
              type="button"
              onClick={handleClear}
              className={styles.clearButton}
            >
              Clear
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export { SearchBar };
