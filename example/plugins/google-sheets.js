const {google} = require('googleapis');

function toStringFormat(pod, values) {
  const keysToStrings = {};
  const header = values.shift().slice(1); // ['key', 'en', 'de', 'it', ...]
  values.forEach(row => {
    const key = row.shift();
    row.forEach((column, i) => {
      const locale = pod.locale(header[i]);
      const value = column;
      keysToStrings[key] = pod.string(
        {
          value: value,
        },
        locale
      );
    });
  });
  return keysToStrings;
}

class GoogleSheetsPlugin {
  constructor(pod, authPlugin) {
    this.pod = pod;
    this.authPlugin = authPlugin;
  }

  async getValuesResponse(options) {
    console.log(
      `Fetching Google Sheet -> ${this.fomatGoogleSheetsUrl(options)}`
    );
    const authClient = this.authPlugin.oauth2;
    const sheets = google.sheets({version: 'v4', auth: authClient});
    const resp = (
      await sheets.spreadsheets.values.get({
        spreadsheetId: options.spreadsheetId,
        range: options.range,
      })
    ).data.values;
    return resp;
  }

  fomatGoogleSheetsUrl(options) {
    return `https://docs.google.com/spreadsheets/d/${options.spreadsheetId}/edit#range=${options.range}`;
  }
}

function register(pod, authPlugin) {
  const sheetsPlugin = new GoogleSheetsPlugin(pod, authPlugin);
  const serverPlugin = pod.plugins.get('ServerPlugin');
  serverPlugin.register(app => {
    app.all('/foo', async (req, res) => {
      const result = await sheetsPlugin.getValuesResponse({
        spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
        range: 'homepage',
      });
      res.send('This is a response from custom middleware.');
    });
  });

  const yamlPlugin = pod.plugins.get('YamlPlugin');
  yamlPlugin.addType('!GoogleSheet', {
    kind: 'mapping',
    construct: options => {
      return async () => {
        const resp = await sheetsPlugin.getValuesResponse(options);
        if (options.format === 'strings') {
          return toStringFormat(pod, resp);
        }
        return resp;
      };
    },
  });

  return sheetsPlugin;
}

module.exports = {
  register: register,
};
