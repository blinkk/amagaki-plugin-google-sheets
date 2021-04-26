const fs = require("fs");
const fsPath = require("path");
const { google } = require("googleapis");

function toStringFormat(pod, values) {
  const keysToStrings = {};
  const header = values.shift().slice(1); // ['key', 'en', 'de', 'it', ...]
  values.forEach((row) => {
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
  constructor(pod, options) {
    this.pod = pod;
    this.auth = new google.auth.GoogleAuth({
      keyFile: options.serviceAccountKeyFile,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }

  async getValuesResponse(options) {
    console.log(
      `Fetching Google Sheet -> ${this.fomatGoogleSheetsUrl(options)}`
    );
    const cachePath = this.getCachePath(options);
    const authClient = await this.auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });
    const resp = (
      await sheets.spreadsheets.values.get({
        spreadsheetId: options.spreadsheetId,
        range: options.range,
      })
    ).data.values;
    if (cachePath) {
      this.writeCache(options, resp);
    }
    return resp;
  }

  fomatGoogleSheetsUrl(options) {
    return `https://docs.google.com/spreadsheets/d/${options.spreadsheetId}/edit#range=${options.range}`;
  }

  getCachePath(options) {
    if (!options.cacheKey) {
      return;
    }
    return this.pod.getAbsoluteFilePath(`/cache/${options.cacheKey}.json`);
  }

  writeCache(options, resp) {
    const cachePath = this.getCachePath(options);
    const dirPath = fsPath.dirname(cachePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    // NOTE: Disable writing file as this triggers a cache flush on the pod.
    // Need a way to have a dedicated cache folder that doesn't reset the pod
    // cache.
    // fs.writeFileSync(cachePath, JSON.stringify(resp, null, 2));
  }
}

async function register(pod, options) {
  const googleSheetsPlugin = new GoogleSheetsPlugin(pod, options);
  const yamlPlugin = pod.plugins.get("YamlPlugin");
  yamlPlugin.addType("!GoogleSheet", {
    kind: "mapping",
    construct: (options) => {
      return async (context) => {
        const resp = await googleSheetsPlugin.getValuesResponse(options);
        if (options.format === "strings") {
          return toStringFormat(pod, resp);
        }
        return resp;
      };
    },
  });
}

module.exports = {
  register: register,
};
