# amagaki-plugin-google-sheets

[![NPM Version][npm-image]][npm-url]
[![GitHub Actions][github-image]][github-url]
[![TypeScript Style Guide][gts-image]][gts-url]

An Amagaki plugin for fetching content from Google Sheets. Capable of
transforming Google Sheets into various formats, and supports using Google
Sheets for managing translations.

Use this to allow non-developers to manage content (including website copy,
data, and translations) in a Google Sheet, and consuming that content within
your Amagaki project to build a website.

## Usage

1. Install the plugin.

```shell
npm install --save @amagaki/amagaki-plugin-google-sheets
```

2. Acquire a service account key file. You can do this interactively, from the
   IAM section of the Google Cloud Console, or you can do this via the `gcloud`
   CLI (see below).

```shell
PROJECT=yourGcpProject \
  gcloud --project=$PROJECT \
    iam service-accounts create \
    amagaki \
  && gcloud --project=$PROJECT \
    iam service-accounts keys create \
    --iam-account amagaki@$PROJECT.iam.gserviceaccount.com \
    key.json
```

2. Ensure the sheet is shared with the service account.

3. Ensure `key.json` is added to your `.gitignore`.

4. Add to `amagaki.js`.

```js
const googleSheetsPlugin = require('./plugins/google-sheets');

module.exports = async function (pod) {
  const sheetsPlugin = googleSheetsPlugin.register(pod, {
    keyFile: 'key.json',
  });

  // Run Google Sheets plugin only when dev server starts.
  const serverPlugin = pod.plugins.get('ServerPlugin');
  serverPlugin.register(() => {
    // Saves a single file, "homepage" tab, `strings` transformation.
    sheetsPlugin.saveFile({
      podPath: '/content/partials/homepage.yaml',
      spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
      range: 'homepage',
      transform: 'strings',
    });

    // Save a single file, "about" tab, `grid` transformation.
    sheetsPlugin.saveFile({
      podPath: '/content/partials/about.yaml',
      spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
      range: 'about',
      transform: 'grid',
    });

    // Save a single file, "about" tab, `objectRows` transformation.
    sheetsPlugin.saveFile({
      podPath: '/content/partials/aboutObjectRows.yaml',
      spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
      range: 'about',
      transform: 'objectRows',
    });

    // Binds a collection to specified tabs within the Google Sheet. Deletes
    // files from the collection that no longer exist in the sheet.
    // Because the `transform` value is set to `strings`, the plugin will also
    // import any translations contained within the sheets to their respective
    // locale files.
    sheetsPlugin.bindCollection({
      collectionPath: '/content/strings',
      spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
      ranges: ['homepage', 'about'],
      transform: 'strings',
    });
  });
};

```

## Transform options

### strings

NOTE: The `preferString` and `!IfLocale` features of this plugin are currently
unimplemented.

Use the `strings` format when managing website copy (and optionally translation
strings) inside a Google Sheet. Non-translation data can also be added, by
leaving the `type` field blank.

Converts a sheet formatted as a grid of strings into a mapping of keys to
localized strings. The sheet must be in the following format:

```markdown
| key  | type         | en        | de      | es    |
| ---- | ------------ | --------- | ------- | ----- |
| foo  | string       | Hello     | Hallo   | Hola  |
| bar  | string       | Bye       | Tschüss | Adiós |
| bar  | preferString | Goodbye   |         |       |
| baz  | | https://example.com | https://example.de | https://example.es |
```

The values are transformed to:

```yaml
foo:
  !pod.string
    value: Hello
bar:
  !pod.string
    prefer: Goodbye
    value: Bye
baz:
  !IfLocale
    default: https://example.com
    de: https://example.de
    es: https://example.es
```

Furthermore, any translation strings denoted by type "string" within the sheet
are automatically saved to the pod's locale files. Any rows that do not have
type "string" are not imported to the locale files.


To refer to your Google Sheets data from documents, use the `!pod.yaml` YAML
type. The content can be accessed in a template regularly. `!pod.string` types
are automatically translated, and `!IfLocale` types are automatically localized.

```yaml
partials:
- partial: hero
  headline: !pod.yaml /content/strings/homepage.yaml?foo
  body: !pod.yaml /content/strings/homepage.yaml?bar
  button:
    url: !pod.yaml /content/strings/homepage.yaml?baz
```

### grid

Converts a sheet formatted as a grid of strings into a mapping of keys to
headers to values. The sheet must be in the following format:

```
| <BLANK>  | header1 | header2 |
| -------- | ------- | ------- |
| foo      | a       | b       |
| bar      | c       | d       |
```

The values are transformed to:

```yaml
foo:
  header1: a
  header2: b
bar:
  header1: c
  header2: d
```

### objectRows

Converts a sheet formatted as a grid of strings into a list of objects
mapping headers to values. The sheet must be in the following format:

```
| header1  | header2 | header3 |
| -------- | ------- | ------- |
| foo      | a       | b       |
| bar      | c       | d       |
```

The values are transformed to:

```yaml
- header1: foo
  header2: a
  header3: b
- header1: bar
  header2: c
  header3: d
```

### rows (default)

Does not modify response from Google Sheets. The sheet is simply serialized as a
list of lists.

```
| header1  | header2 | header3 |
| -------- | ------- | ------- |
| foo      | a       | b       |
| bar      | c       | d       |
```

The values are transformed to:

```yaml
- - header1
  - header2
  - header3
- - foo
  - a
  - b
- - bar
  - c
  - d
```

[github-image]: https://github.com/blinkk/amagaki-plugin-google-sheets/workflows/Run%20tests/badge.svg
[github-url]: https://github.com/blinkk/amagaki-plugin-google-sheets/actions
[npm-image]: https://img.shields.io/npm/v/@amagaki/amagaki-plugin-google-sheets.svg
[npm-url]: https://npmjs.org/package/@amagaki/amagaki-plugin-google-sheets
[gts-image]: https://img.shields.io/badge/code%20style-google-blueviolet.svg
[gts-url]: https://github.com/google/gts