import {Pod, StringOptions} from '@amagaki/amagaki';

import {GoogleSheetsValuesReponse} from './google-sheets';

const RowType = {
  PREFER_STRING: 'preferString',
  STRING: 'string',
};

export const Transformation = {
  GRID: 'grid',
  OBJECT_ROWS: 'objectRows',
  ROWS: 'rows',
  STRINGS: 'strings',
};

export type TransformationType = string | Function;
export type KeysToStrings = Record<string, string>;
export type KeysToLocalesToStrings = Record<string, KeysToStrings>;
export type GridType = Record<string, Record<string, string>>;

/**
 * Converts a sheet formatted as a grid of strings into a mapping of keys to
 * localized strings. The sheet must be in the following format:
 *
 * | key  | type         | en        | de      | es    |
 * | ---- | ------------ | --------- | ------- | ----- |
 * | foo  | string       | Hello     | Hallo   | Hola  |
 * | bar  | string       | Bye       | Tschüss | Adiós |
 * | bar  | preferString | Goodbye   |         |       |
 *
 * The values are transformed to:
 *
 * ```
 * foo:
 *   !pod.string
 *     value: Hello
 * bar:
 *   !pod.string
 *     prefer: Goodbye
 *     value: Bye
 * ```
 *
 * Furthermore, any translation strings are automatically saved to the pod's
 * locale files.
 */
export const toStrings = (pod: Pod, values: GoogleSheetsValuesReponse) => {
  const keysToLocalesToStrings: KeysToLocalesToStrings = {};
  const keysToStrings: KeysToStrings = {};
  const rawHeader = values.shift();
  if (!rawHeader) {
    throw new Error('Unable to find header row, sheet is likely empty.');
  }
  // Header row must be in format:
  // ['key', 'type', 'en', 'de', 'it', ...
  if (rawHeader[0] !== 'key' || rawHeader[1] !== 'type') {
    throw new Error(
      `Found invalid header for string sheet: "${rawHeader[0]}", "${rawHeader[1]}". The first two header cells must be "key" and "type".`
    );
  }
  const header = rawHeader.slice(2);
  values.forEach(row => {
    const localesToStrings: Record<string, string> = {};
    const key = row.shift();
    // Skip rows without keys.
    if (!key) {
      return;
    }
    const rowType = row.shift();
    row.forEach((column, i) => {
      const locale = pod.locale(header[i]);
      const value = column;
      // TODO: Fix merging stringOptions across rows.
      const stringOptions: StringOptions = {
        value: '',
      };
      if (rowType === RowType.STRING) {
        stringOptions.value = value;
      } else if (rowType === RowType.PREFER_STRING) {
        stringOptions.prefer = value;
      }
      // TODO: Implement string serialization, and ensure stringOptions aren't
      // overwritten.
      // keysToStrings[key] = pod.string(stringOptions, locale);
      if (locale.id === pod.defaultLocale.id) {
        keysToStrings[key] = value;
      }
      if (
        rowType &&
        [RowType.STRING, RowType.PREFER_STRING].includes(rowType)
      ) {
        localesToStrings[locale.id] = value;
      }
    });
    keysToLocalesToStrings[key] = localesToStrings;
  });
  return {
    keysToStrings: keysToStrings,
    keysToLocales: keysToLocalesToStrings,
  };
};

/**
 * Converts a sheet formatted as a grid of strings into a mapping of keys to
 * headers to values. The sheet must be in the following format:
 *
 * | <BLANK>  | header1 | header2 |
 * | -------- | ------- | ------- |
 * | foo      | a       | b       |
 * | bar      | c       | d       |
 *
 * The values are transformed to:
 *
 * ```
 * foo:
 *   header1: a
 *   header2: b
 * bar:
 *   header1: c
 *   header2: d
 * ```
 */
export const toGrid = (pod: Pod, values: GoogleSheetsValuesReponse) => {
  const rawHeader = values.shift();
  if (!rawHeader) {
    throw new Error('Unable to find header row, sheet is likely empty.');
  }
  // Header row must be in format:
  // ['key', 'type', 'en', 'de', 'it', ...
  if (rawHeader[0] !== '') {
    throw new Error(
      `Found invalid header for grid sheet. The first cell must be blank, found: ${rawHeader[0]}.`
    );
  }
  const header = rawHeader.slice(1);
  const grid: GridType = {};
  values.forEach(row => {
    const key = row.shift();
    // Skip empty rows.
    if (!key) {
      return;
    }
    grid[key] = {};
    row.forEach((value, i) => {
      grid[key][header[i]] = value;
    });
  });
  return grid;
};

/**
 * Converts a sheet formatted as a grid of strings into a list of objects
 * mapping headers to values. The sheet must be in the following format:
 *
 * | header1  | header2 | header3 |
 * | -------- | ------- | ------- |
 * | foo      | a       | b       |
 * | bar      | c       | d       |
 *
 * The values are transformed to:
 *
 * ```
 * - header1: foo
 *   header2: a
 *   header3: b
 * - header1: bar
 *   header2: c
 *   header3: d
 * ```
 */
export const toObjectRows = (pod: Pod, values: GoogleSheetsValuesReponse) => {
  const header = values.shift();
  if (!header) {
    throw new Error('Unable to find header row, sheet is likely empty.');
  }
  type ObjectRow = Record<string, string>;
  const objectRows: ObjectRow[] = [];
  values.forEach(row => {
    const objectRow: ObjectRow = {};
    row.forEach((value, i) => {
      objectRow[header[i]] = value;
    });
    objectRows.push(objectRow);
  });
  return objectRows;
};

export const validate = (transformation: unknown) => {
  const validTransformations = Object.values(Transformation);
  if (
    typeof transformation !== 'function' &&
    typeof transformation === 'string' &&
    !validTransformations.includes(transformation)
  ) {
    throw new Error(
      `Invalid transformation "${transformation}". Valid transformations are: ${validTransformations.join(
        ', '
      )}`
    );
  }
};
