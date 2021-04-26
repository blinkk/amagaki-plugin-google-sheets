# amagaki-plugin-google-sheets

NOTE: This project is in beta and is not ready for use.

An Amagaki plugin for fetching content from Google Sheets.

## Usage

1. Install the plugin.

```bash
npm install --save @amagaki/amagaki-plugin-google-sheets
```

2. Add to `amagaki.js`.

```js
const googleSheetsPlugin = require('./plugins/google-sheets');

module.exports = function (pod) {
  googleSheetsPlugin.register(pod, {
    serviceAccountKeyFile: <pathToKeyFile>,
  });
};
```

3. Use the YAML type in content files to fetch data.

```yaml
sheet: !GoogleSheet
  spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c'
  range: 'homepage'
  cacheKey: 'homepage'
```