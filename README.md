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
const googleAuth = require('@amagaki/amagaki-plugin-google-auth');
const googleSheetsPlugin = require('@amagaki/amagaki-plugin-google-sheets');

module.exports = function (pod) {
  googleSheetsPlugin.register(pod, {
    serviceAccountKeyFile: <pathToKeyFile>,
  });
};
```