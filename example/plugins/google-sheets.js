const googleAuthPlugin = require('./google-auth');
const {google} = require('googleapis');
const fsPath = require('path');
const yaml = require('js-yaml');
const fs = require('fs');
const {Builder} = require('@amagaki/amagaki/src/builder');

const Transformation = {
  GRID: 'grid',
  OBJECT_ROWS: 'objectRows',
  ROWS: 'rows',
  STRINGS: 'strings',
};

const RowType = {
  PREFER_STRING: 'preferString',
  STRING: 'string',
};

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
function transformToStrings(pod, values) {
  const keysToLocalesToStrings = {};
  const keysToStrings = {};
  const rawHeader = values.shift();
  // Header row must be in format:
  // ['key', 'type', 'en', 'de', 'it', ...
  if (rawHeader[0] !== 'key' || rawHeader[1] !== 'type') {
    throw new Error(
      `Found invalid header for string sheet: "${rawHeader[0]}", "${rawHeader[1]}". The first two header cells must be "key" and "type".`
    );
  }
  const header = rawHeader.slice(2);
  values.forEach(row => {
    const localesToStrings = {};
    const key = row.shift();
    const rowType = row.shift();
    row.forEach((column, i) => {
      const locale = pod.locale(header[i]);
      const value = column;
      const stringOptions = {};
      if (rowType === RowType.STRING) {
        stringOptions.value = value;
      } else if (rowType === RowType.PREFER_STRING) {
        stringOptions.prefer = value;
      }
      // TODO: Implement string serialization, and ensure stringOptions aren't
      // overwritten.
      // keysToStrings[key] = pod.string(stringOptions, locale);
      keysToStrings[key] = value;
      if ([RowType.STRING, RowType.PREFER_STRING].includes(rowType)) {
        localesToStrings[locale.id] = value;
      }
    });
    keysToLocalesToStrings[key] = localesToStrings;
  });
  return {
    keysToStrings: keysToStrings,
    keysToLocales: keysToLocalesToStrings,
  };
}

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
function transformToGrid(pod, values) {
  const rawHeader = values.shift();
  // Header row must be in format:
  // ['key', 'type', 'en', 'de', 'it', ...
  if (rawHeader[0] !== '') {
    throw new Error(
      `Found invalid header for grid sheet. The first cell must be blank, found: ${rawHeader[0]}.`
    );
  }
  const header = rawHeader.slice(1);
  const grid = {};
  values.forEach(row => {
    const key = row.shift();
    grid[key] = {};
    row.forEach((value, i) => {
      grid[key][header[i]] = value;
    });
  });
  return grid;
}

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
function transformToObjectRows(pod, values) {
  const header = values.shift().slice(1);
  const objectRows = [];
  values.forEach(row => {
    const objectRow = {};
    row.forEach((value, i) => {
      objectRow[header[i]] = value;
    });
    objectRows.push(objectRow);
  });
  return objectRows;
}

/**
 * Updates the pod's locale files with translations retrieved from the sheet.
 */
async function saveLocales(pod, keysToLocales) {
  const catalogsToMerge = {};
  for (const localesToStrings of Object.values(keysToLocales)) {
    const baseString = localesToStrings[pod.defaultLocale.id];
    // No source translation found, skip it.
    if (!baseString) {
      return;
    }
    for (const [locale, translatedString] of Object.entries(localesToStrings)) {
      if (!catalogsToMerge[locale]) {
        catalogsToMerge[locale] = {};
      }
      catalogsToMerge[locale][baseString] = translatedString;
    }
  }
  // TODO: Replace this code once the locale catalog format within Amagaki is
  // stable, and there are built-in methods for updating catalogs and writing
  // translations.
  for (const [localeId, catalog] of Object.entries(catalogsToMerge)) {
    const locale = pod.locale(localeId);
    let contentToWrite;
    if (!pod.fileExists(locale.podPath)) {
      contentToWrite = yaml.dump(
        {translations: catalog},
        {
          schema: pod.yamlSchema,
        }
      );
    } else {
      const existingContent = pod.readYaml(locale.podPath);
      Object.assign(existingContent['translations'], catalog);
      const content = yaml.dump(existingContent, {
        schema: pod.yamlSchema,
      });
      contentToWrite = content;
    }
    await pod.builder.writeFileAsync(
      pod.getAbsoluteFilePath(locale.podPath),
      contentToWrite
    );
    console.log(`Saved -> ${locale.podPath}`);
  }
}

/**
 * Transforms the response from Google Sheets using an inbuilt transformation.
 * Custom transformations can be used by supplying a function for the
 * transformation instead one of the built-in transformation names.
 */
async function transform(pod, values, transformation) {
  if (!transformation) {
    return values;
  }
  const validTransformations = Object.values(Transformation);
  if (
    !validTransformations.includes(transformation) &&
    typeof transformation !== 'function'
  ) {
    throw new Error(
      `Invalid transformation "${transformation}". Valid transformations are: ${validTransformations.join(
        ', '
      )}`
    );
  }
  if (transformation === Transformation.STRINGS) {
    const result = transformToStrings(pod, values);
    await saveLocales(pod, result.keysToLocales);
    return result.keysToStrings;
  } else if (transformation === Transformation.GRID) {
    return transformToGrid(pod, values);
  } else if (transformation === Transformation.OBJECT_ROWS) {
    return transformToObjectRows(pod, values);
  } else if (typeof transformation === 'function') {
    return transformation(values);
  }
  return values;
}

class GoogleSheetsPlugin {
  constructor(pod, authPluginOptions) {
    this.pod = pod;
    this.authPlugin =
      pod.plugins.get('GoogleAuthPlugin') ||
      googleAuthPlugin.register(pod, authPluginOptions);
    if (!this.authPlugin) {
      throw new Error('Unable to find GoogleAuthPlugin');
    }
  }

  getClient() {
    const authClient = this.authPlugin.authClient;
    return google.sheets({version: 'v4', auth: authClient});
  }

  fomatGoogleSheetsUrl(options) {
    return `https://docs.google.com/spreadsheets/d/${options.spreadsheetId}/edit#range=${options.range}`;
  }

  async getValuesResponse(options) {
    console.log(
      `Fetching Google Sheet -> ${this.fomatGoogleSheetsUrl(options)}`
    );
    const sheets = this.getClient();
    const resp = (
      await sheets.spreadsheets.values.get({
        spreadsheetId: options.spreadsheetId,
        range: options.range,
      })
    ).data.values;
    return resp;
  }

  async saveFileInternal(podPath, content) {
    let rawContent;
    if (podPath.endsWith('.json')) {
      rawContent = JSON.stringify(content);
    } else if (podPath.endsWith('.yaml')) {
      rawContent = yaml.dump(content);
    } else {
      throw new Error(
        `Cannot save file due to unsupported extenson -> ${podPath}`
      );
    }
    const realPath = this.pod.getAbsoluteFilePath(podPath);
    this.pod.builder.writeFileAsync(realPath, rawContent);
    console.log(`Saved -> ${podPath}`);
  }

  async saveFile(options) {
    const podPath = options.podPath;
    const responseValues = await this.getValuesResponse({
      spreadsheetId: options.spreadsheetId,
      range: options.range,
    });
    const values = await transform(this.pod, responseValues, options.transform);
    this.saveFileInternal(podPath, values);
  }

  async bindCollection(options) {
    const realPath = this.pod.getAbsoluteFilePath(options.collectionPath);
    // `ensureDirectoryExists` is actually `ensureDirectoryExistsForFile`.
    Builder.ensureDirectoryExists(fsPath.join(realPath, '_collection.yaml'));
    const existingFiles = fs.readdirSync(realPath).filter(path => {
      return !path.startsWith('_');
    });
    const newFiles = [];
    const sheets = this.getClient();
    const valueRanges = (
      await sheets.spreadsheets.values.batchGet({
        spreadsheetId: options.spreadsheetId,
        ranges: options.ranges,
      })
    ).data.valueRanges;
    for (const valueRange of valueRanges) {
      const basename = `${valueRange.range.split('!')[0]}.yaml`;
      const podPath = fsPath.join(options.collectionPath, basename);
      const values = await transform(
        this.pod,
        valueRange.values,
        options.transform
      );
      newFiles.push(basename);
      this.saveFileInternal(podPath, values);
    }
    const diff = existingFiles.filter(basename => !newFiles.includes(basename));
    for (const basename of diff) {
      const absPath = fsPath.join(realPath, basename);
      const podPath = fsPath.join(options.collectionPath, basename);
      fs.unlinkSync(absPath);
      console.log(`Deleted -> ${podPath}`);
    }
  }
}

function register(pod, authPluginOptions) {
  return new GoogleSheetsPlugin(pod, authPluginOptions);
}

module.exports = {
  register: register,
};
