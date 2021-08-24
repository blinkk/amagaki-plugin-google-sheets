import * as googleAuthPlugin from './google-auth';
import * as transformations from './transformations';

import {Builder, Pod} from '@amagaki/amagaki';
import {google, sheets_v4} from 'googleapis';

import {GoogleAuthPluginOptions} from './google-auth';
import {KeysToLocalesToStrings} from './transformations';
import fs from 'fs';
import fsPath from 'path';
import yaml from 'js-yaml';

export interface SaveFileOptions {
  podPath: string;
  spreadsheetId: string;
  range: string;
  transform?: transformations.TransformationType;
}

export interface BindCollectionOptions {
  collectionPath: string;
  spreadsheetId: string;
  ranges: string[];
  transform?: transformations.TransformationType;
}

export type GoogleSheetsValuesReponse = string[][];

/**
 * Updates the pod's locale files with translations retrieved from the sheet.
 */
async function saveLocales(pod: Pod, keysToLocales: KeysToLocalesToStrings) {
  type Catalog = Record<string, string>;
  type LocalesToCatalogs = Record<string, Catalog>;
  const catalogsToMerge: LocalesToCatalogs = {};
  for (const localesToStrings of Object.values(keysToLocales)) {
    const baseString = localesToStrings[pod.defaultLocale.id];
    // No source translation found, skip it.
    if (!baseString) {
      continue;
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
      contentToWrite = pod.dumpYaml({translations: catalog});
    } else {
      const existingContent = pod.readYaml(locale.podPath) || {};
      Object.assign(existingContent['translations'] || {}, catalog);
      const content = pod.dumpYaml(existingContent);
      contentToWrite = content;
    }
    await pod.builder.writeFileAsync(
      pod.getAbsoluteFilePath(locale.podPath),
      contentToWrite
    );
  }
  return catalogsToMerge;
}

/**
 * Transforms the response from Google Sheets using an inbuilt transformation.
 * Custom transformations can be used by supplying a function for the
 * transformation instead one of the built-in transformation names.
 */
async function transform(
  pod: Pod,
  values: GoogleSheetsValuesReponse,
  transformation: unknown
) {
  if (!transformation) {
    return values;
  }
  transformations.validate(transformation);
  if (transformation === transformations.Transformation.STRINGS) {
    const result = transformations.toStrings(pod, values);
    const catalogs = await saveLocales(pod, result.keysToLocales);
    console.log(`Saved locales -> ${Object.keys(catalogs).sort().join(', ')}`);
    return result.keysToFields;
  } else if (transformation === transformations.Transformation.GRID) {
    return transformations.toGrid(pod, values);
  } else if (transformation === transformations.Transformation.OBJECT_ROWS) {
    return transformations.toObjectRows(pod, values);
  } else if (typeof transformation === 'function') {
    return transformation(values);
  }
  return values;
}

export class GoogleSheetsPlugin {
  pod: Pod;
  authPlugin: googleAuthPlugin.GoogleAuthPlugin;

  constructor(pod: Pod, authPluginOptions: GoogleAuthPluginOptions) {
    this.pod = pod;
    this.authPlugin =
      (pod.plugins.get(
        'GoogleAuthPlugin'
      ) as googleAuthPlugin.GoogleAuthPlugin) ||
      googleAuthPlugin.register(pod, authPluginOptions);
    if (!this.authPlugin) {
      throw new Error('Unable to find GoogleAuthPlugin');
    }
  }

  static register = (pod: Pod, authPluginOptions: GoogleAuthPluginOptions) => {
    return new GoogleSheetsPlugin(pod, authPluginOptions);
  };

  getClient() {
    const authClient = this.authPlugin.authClient;
    return google.sheets({version: 'v4', auth: authClient});
  }

  fomatGoogleSheetsUrl(
    params: sheets_v4.Params$Resource$Spreadsheets$Values$Get
  ) {
    return `https://docs.google.com/spreadsheets/d/${params.spreadsheetId}/edit#range=${params.range}`;
  }

  async getValuesResponse(
    params: sheets_v4.Params$Resource$Spreadsheets$Values$Get
  ) {
    console.log(
      `Fetching Google Sheet -> ${this.fomatGoogleSheetsUrl(params)}`
    );
    const sheets = this.getClient();
    const resp = (
      await sheets.spreadsheets.values.get({
        range: params.range,
        spreadsheetId: params.spreadsheetId,
      })
    ).data.values;
    return resp;
  }

  async saveFileInternal(podPath: string, content: object) {
    let rawContent: string;
    if (podPath.endsWith('.json')) {
      rawContent = JSON.stringify(content);
    } else if (podPath.endsWith('.yaml')) {
      rawContent = this.pod.dumpYaml(content);
    } else {
      throw new Error(
        `Cannot save file due to unsupported extenson -> ${podPath}`
      );
    }
    const realPath = this.pod.getAbsoluteFilePath(podPath);
    await this.pod.builder.writeFileAsync(realPath, rawContent);
    console.log(`Saved -> ${podPath}`);
  }

  async saveFile(options: SaveFileOptions) {
    const podPath = options.podPath;
    const responseValues = await this.getValuesResponse({
      spreadsheetId: options.spreadsheetId,
      range: options.range,
    });
    if (!responseValues) {
      throw new Error(
        `Nothing found in sheet -> ${options.spreadsheetId} with range "${options.range}"`
      );
    }
    const values = await transform(this.pod, responseValues, options.transform);
    await this.saveFileInternal(podPath, values);
  }

  async bindCollection(options: BindCollectionOptions) {
    const realPath = this.pod.getAbsoluteFilePath(options.collectionPath);
    // `ensureDirectoryExists` is actually `ensureDirectoryExistsForFile`.
    Builder.ensureDirectoryExists(fsPath.join(realPath, '_collection.yaml'));
    const existingFiles = fs.readdirSync(realPath).filter(path => {
      return !path.startsWith('_');
    });
    const newFiles: string[] = [];
    const sheets = this.getClient();
    const valueRanges = (
      await sheets.spreadsheets.values.batchGet({
        spreadsheetId: options.spreadsheetId,
        ranges: options.ranges,
      })
    ).data.valueRanges;
    if (!valueRanges) {
      throw new Error(
        `Nothing found from sheets for ${
          options.spreadsheetId
        } with ranges: ${options.ranges.join(', ')}`
      );
    }
    for (const valueRange of valueRanges) {
      if (!valueRange.range || !valueRange.values) {
        continue;
      }
      // Range can be formatted like: `homepage!A1:Z999`
      const basename = `${valueRange.range
        .split('!')[0]
        .replace(/'/gi, '')
        .replace(/ /gi, '-')}.yaml`;
      const podPath = fsPath.join(options.collectionPath, basename);
      const values = await transform(
        this.pod,
        valueRange.values,
        options.transform
      );
      newFiles.push(basename);
      await this.saveFileInternal(podPath, values);
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
