import {CellTypes, GoogleSheetsValuesReponse} from './google-sheets';
import {LocalizableData, Pod, TranslationString} from '@amagaki/amagaki';

import {ColumnsToCellTypes} from '.';

const RowType = {
  PREFER_STRING: 'preferString',
  STRING: 'string',
  EXPLICIT: 'explicit',
  DATA: '',
};

export const Transformation = {
  GRID: 'grid',
  OBJECT_ROWS: 'objectRows',
  ROWS: 'rows',
  STRINGS: 'strings',
};

export type TransformationType = string | Function;
export type Dumpable = LocalizableData | TranslationString | string;
export type keysToFields = Record<string, Dumpable>;
export type keysToStrings = Record<string, string>;
export type KeysToLocalesToStrings = Record<string, keysToStrings>;
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
 * | baz  |              | base.jpg  | de.jpg  |       |
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
 * baz: !IfLocale
 *   default: base.jpg
 *   de: de.jpg
 * ```
 *
 * Furthermore, any translation strings are automatically saved to the pod's
 * locale files.
 */
export const toStrings = (
  pod: Pod,
  values: GoogleSheetsValuesReponse,
  cellTypes?: CellTypes
) => {
  const keysToLocalesToStrings: KeysToLocalesToStrings = {};
  const keysToFields: keysToFields = {};
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
  values.forEach((row, n) => {
    const localesToStrings: Record<string, any> = {};
    const key = row.shift()?.trim() as string;
    // Skip rows without keys.
    if (!key) {
      return;
    }
    const rowType = row.shift()?.trim();
    const isCustomCellType = Boolean(
      rowType && cellTypes && rowType in cellTypes
    );
    // Fill the array with empty strings to ensure all keys are added to YAML
    // files.
    const blankColumns = header.length - row.length;
    if (blankColumns) {
      row = [...row, ...Array(blankColumns).fill('')];
    }
    row.forEach((column, i) => {
      const localeId = header[i];
      // Skip column headers that are unlikely to be locales.
      if (
        localeId.includes(' ') ||
        localeId.startsWith('*') ||
        localeId.startsWith('_') ||
        localeId.length > 10 // Unlikely any locale IDs are longer than 10.
      ) {
        return;
      }
      const locale = pod.locale(localeId);
      let value = column.trim();

      let existingField = keysToFields[key] as Dumpable;
      const isDefaultLocale = locale.id === pod.defaultLocale.id;
      if (existingField) {
        // Combine two rows with the same key into one `TranslationString`
        // object, setting the `value` and `prefer` values individually.
        if (isDefaultLocale && rowType === RowType.STRING) {
          (existingField as TranslationString).value = value;
        } else if (isDefaultLocale && rowType === RowType.PREFER_STRING) {
          (existingField as TranslationString).prefer = value;
        } else if (
          rowType === RowType.DATA ||
          rowType === RowType.EXPLICIT ||
          isCustomCellType
        ) {
          let localizableDataKey = locale.id;
          if (rowType === RowType.DATA && isDefaultLocale) {
            localizableDataKey = 'default';
          }

          // Custom cell type.
          if (rowType && isCustomCellType && cellTypes) {
            value = cellTypes[rowType](value);
          }

          // Avoid adding empty keys.
          if (value) {
            (existingField as LocalizableData).data[localizableDataKey] = value;
          }
        }
      } else {
        if (rowType === RowType.STRING) {
          existingField = pod.string({value: value});
        } else if (rowType === RowType.PREFER_STRING) {
          existingField = pod.string({prefer: value, value: value});
        } else if (
          rowType === RowType.DATA ||
          rowType === RowType.EXPLICIT ||
          isCustomCellType
        ) {
          const data: Record<string, string> = {};
          let localizableDataKey = locale.id;

          if (rowType === RowType.DATA && isDefaultLocale) {
            localizableDataKey = 'default';
          }

          // Custom cell type.
          if (rowType && isCustomCellType && cellTypes) {
            value = cellTypes[rowType](value);
          }

          // Avoid adding empty keys.
          if (value) {
            data[localizableDataKey] = value;
          }
          const localizableData = new LocalizableData(pod, data);
          existingField = localizableData;
        }
      }

      if (isDefaultLocale) {
        keysToFields[key] = existingField;
      }
      if (
        rowType &&
        [RowType.STRING, RowType.PREFER_STRING].includes(rowType)
      ) {
        localesToStrings[locale.id] = value.trim();
      }
    });
    keysToLocalesToStrings[`${key}:${n}`] = localesToStrings;
  });
  return {
    keysToFields: keysToFields,
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
export const toGrid = (
  pod: Pod,
  values: GoogleSheetsValuesReponse,
  cellTypes?: CellTypes,
  columnsToCellTypes?: ColumnsToCellTypes
) => {
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
    const key = row.shift()?.trim();
    // Skip empty rows.
    if (!key) {
      return;
    }
    grid[key] = {};
    row.forEach((value, i) => {
      const headerCell = header[i];
      if (cellTypes && columnsToCellTypes && columnsToCellTypes[headerCell]) {
        value = cellTypes[columnsToCellTypes[headerCell]](value);
      }
      grid[key][headerCell] = value.trim();
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
export const toObjectRows = (
  pod: Pod,
  values: GoogleSheetsValuesReponse,
  cellTypes?: CellTypes,
  columnsToCellTypes?: ColumnsToCellTypes
) => {
  const header = values.shift();
  if (!header) {
    throw new Error('Unable to find header row, sheet is likely empty.');
  }
  type ObjectRow = Record<string, string>;
  const objectRows: ObjectRow[] = [];
  values.forEach(row => {
    const objectRow: ObjectRow = {};
    row.forEach((value, i) => {
      const headerCell = header[i];
      if (cellTypes && columnsToCellTypes && columnsToCellTypes[headerCell]) {
        value = cellTypes[columnsToCellTypes[headerCell]](value);
      }
      objectRow[headerCell] = value.trim();
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
