import { describe, it, expect } from 'vitest';
import type { InputField } from '../../../../src/components/MainPanel/SearchBar/SearchBar';

// Re-implement the pure function for direct unit testing
// (it's not separately exported from SearchBar.tsx)
const MAX_FIELDS_PER_ROW = 3;

const splitFieldsIntoRows = (
  inputFields: InputField[],
  rowConfig?: number[],
): InputField[][] => {
  const fieldRows: InputField[][] = [];
  let fieldIndex = 0;

  if (rowConfig) {
    for (const fieldsInRow of rowConfig) {
      if (fieldIndex < inputFields.length) {
        fieldRows.push(inputFields.slice(fieldIndex, fieldIndex + fieldsInRow));
        fieldIndex += fieldsInRow;
      }
    }
    while (fieldIndex < inputFields.length) {
      fieldRows.push(
        inputFields.slice(fieldIndex, fieldIndex + MAX_FIELDS_PER_ROW),
      );
      fieldIndex += MAX_FIELDS_PER_ROW;
    }
  } else {
    for (let i = 0; i < inputFields.length; i += MAX_FIELDS_PER_ROW) {
      fieldRows.push(inputFields.slice(i, i + MAX_FIELDS_PER_ROW));
    }
  }

  return fieldRows;
};

const makeField = (name: string): InputField => ({
  label: name,
  name,
  type: 'text',
  typeOptions: { placeholder: name },
});

describe('splitFieldsIntoRows', () => {
  it('returns empty array for empty input', () => {
    expect(splitFieldsIntoRows([])).toEqual([]);
  });

  it('puts up to 3 fields in one row by default', () => {
    const fields = [makeField('a'), makeField('b'), makeField('c')];
    const rows = splitFieldsIntoRows(fields);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveLength(3);
  });

  it('splits into multiple rows when more than 3 fields', () => {
    const fields = Array.from({ length: 5 }, (_, i) => makeField(`f${i}`));
    const rows = splitFieldsIntoRows(fields);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveLength(3);
    expect(rows[1]).toHaveLength(2);
  });

  it('uses rowConfig to determine fields per row', () => {
    const fields = Array.from({ length: 4 }, (_, i) => makeField(`f${i}`));
    const rows = splitFieldsIntoRows(fields, [1, 3]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveLength(1);
    expect(rows[1]).toHaveLength(3);
  });

  it('falls back to MAX_FIELDS_PER_ROW for remaining fields after rowConfig', () => {
    const fields = Array.from({ length: 7 }, (_, i) => makeField(`f${i}`));
    const rows = splitFieldsIntoRows(fields, [2]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveLength(2);
    expect(rows[1]).toHaveLength(3);
    expect(rows[2]).toHaveLength(2);
  });

  it('handles single field', () => {
    const rows = splitFieldsIntoRows([makeField('only')]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveLength(1);
  });
});
