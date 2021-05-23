const googleSheetsPlugin = require('./plugins/google-sheets');

module.exports = async function (pod) {
  const sheetsPlugin = googleSheetsPlugin.register(pod, {
    keyFile: '/Users/jeremydw/Downloads/madebygoog-52e1c116d139.json',
  });
  sheetsPlugin.saveFile({
    podPath: '/content/partials/homepage.yaml',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    range: 'homepage',
    transform: 'strings',
  });
  sheetsPlugin.saveFile({
    podPath: '/content/partials/about.yaml',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    range: 'about',
    transform: 'grid',
  });
  sheetsPlugin.saveFile({
    podPath: '/content/partials/aboutObjectRows.yaml',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    range: 'about',
    transform: 'objectRows',
  });
  sheetsPlugin.bindCollection({
    collectionPath: '/content/sheets',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    ranges: ['homepage', 'about'],
  });
};
