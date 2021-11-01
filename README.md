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

2. Authenticate. See [authentication](#authentication) for details.
 
3. Add to `amagaki.ts`.

```typescript
import {GoogleSheetsPlugin} from '@amagaki/amagaki-plugin-google-sheets';
import {Pod, ServerPlugin} from '@amagaki/amagaki';

export default (pod: Pod) => {
  // Run Google Sheets plugin when dev server starts.
  const serverPlugin = pod.plugins.get('ServerPlugin') as ServerPlugin;
  serverPlugin.register(async () => {
    const sheets = GoogleSheetsPlugin.register(pod);

    await Promise.all([
      // Binds a collection to specified tabs within the Google Sheet. Deletes
      // files from the collection that no longer exist in the sheet.
      // Because the `transform` value is set to `strings`, the plugin will also
      // import any translations contained within the sheets to their respective
      // locale files.
      sheets.bindCollection({
        collectionPath: '/content/strings',
        spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
        ranges: ['homepage', 'about'],
        transform: 'strings',
      }),

      // Saves a single file, "homepage" tab, `strings` transformation.
      sheets.saveFile({
        podPath: '/content/partials/homepage.yaml',
        spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
        range: 'homepage',
        transform: 'strings',
      }),

      // Save a single file, "about" tab, `grid` transformation.
      sheets.saveFile({
        podPath: '/content/partials/about.yaml',
        spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
        range: 'about',
        transform: 'grid',
      }),

      // Save a single file, "about" tab, `objectRows` transformation.
      sheets.saveFile({
        podPath: '/content/partials/aboutObjectRows.yaml',
        spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
        range: 'about',
        transform: 'objectRows',
      }),
    ]);
  });
};

```

## Transform options

- [amagaki-plugin-google-sheets](#amagaki-plugin-google-sheets)
  - [Usage](#usage)
  - [Transform options](#transform-options)
    - [strings](#strings)
    - [grid](#grid)
    - [objectRows](#objectrows)
    - [rows (default)](#rows-default)
  - [Authentication](#authentication)
    - [Option 1: Using application default credentials](#option-1-using-application-default-credentials)
    - [Option 2: Using a service account key file](#option-2-using-a-service-account-key-file)

### strings

Use the `strings` format when managing website copy (and optionally translation
strings) inside a Google Sheet. Non-translation data can also be added, by
leaving the `type` field blank.  For data that shouldn't fallback to the default
`en` locale, use `explicit` in the `type` field.


Converts a sheet formatted as a grid of strings into a mapping of keys to
localized strings. Additional non-string types can be added to manage localized
data. The sheet must be in the following format:

```markdown
| key | type         | en                  | de                 | es                 |
| --- | ------------ | ------------------- | ------------------ | ------------------ |
| foo | string       | Hello               | Hallo              | Hola               |
| bar | string       | Bye                 | Tschüss            | Adiós              |
| bar | preferString | Goodbye             |                    |                    |
| baz |              | https://example.com | https://example.de | https://example.es |
| qux | explicit     | a                   | b                  |                    |
```

The values are transformed to:

```yaml
foo: !pod.string Hello
bar: !pod.string
  prefer: Goodbye
  value: Bye
baz: !IfLocale
  default: https://example.com
  de: https://example.de
  es: https://example.es
qux: !IfLocale
  en: a
  de: b
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
| <BLANK> | header1 | header2 |
| ------- | ------- | ------- |
| foo     | a       | b       |
| bar     | c       | d       |
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
| header1 | header2 | header3 |
| ------- | ------- | ------- |
| foo     | a       | b       |
| bar     | c       | d       |
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
| header1 | header2 | header3 |
| ------- | ------- | ------- |
| foo     | a       | b       |
| bar     | c       | d       |
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

## Authentication

There are two ways to authenticate. We recommend using the application default
identity (option 1), but using a service account key file is acceptable as well.

### Option 1: Using application default credentials


1. Install the `gcloud SDK`. [See instructions](https://cloud.google.com/sdk/docs/downloads-interactive).*
2. Login and set the application default credentials. Ensure you provide the required scopes.

```bash
gcloud auth application-default login \
  --scopes=openid,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/spreadsheets
```

3. That's it! Now, Amagaki will use the signed in Google Account to fetch content.

*NOTE: If you've never authenticated using `gcloud` before, after installing the SDK, you may need to set a default Google Cloud project. Use the command below after installing the `gcloud SDK`:

```
# Replace $PROJECT with your GCP project ID.
gcloud auth login
gcloud config set project $PROJECT
gcloud auth application-default set-quota-project $PROJECT
```

### Option 2: Using a service account key file


1. Acquire a service account key file. You can do this interactively, from the IAM section of the Google Cloud Console, or you can do this via the `gcloud` CLI (see below for an example).

```
PROJECT=<Google Cloud Project ID>

# Create a service account named `amagaki`.
gcloud --project=$PROJECT \
  iam service-accounts create \
  amagaki

# Create a JSON key and download it to `key.json`.
gcloud --project=$PROJECT \
  iam service-accounts keys create \
  --iam-account amagaki@$PROJECT.iam.gserviceaccount.com \
  key.json
```

2. Ensure `key.json` is added to your `.gitignore`.
3. Ensure the sheet is shared with the service account.
4. Pass `keyFile` to the sheets plugin.

```typescript
GoogleSheetsPlugin.register(pod, {
  keyFile: 'key.json',
});
```

[github-image]: https://github.com/blinkk/amagaki-plugin-google-sheets/workflows/Run%20tests/badge.svg
[github-url]: https://github.com/blinkk/amagaki-plugin-google-sheets/actions
[npm-image]: https://img.shields.io/npm/v/@amagaki/amagaki-plugin-google-sheets.svg
[npm-url]: https://npmjs.org/package/@amagaki/amagaki-plugin-google-sheets
[gts-image]: https://img.shields.io/badge/code%20style-google-blueviolet.svg
[gts-url]: https://github.com/google/gts
