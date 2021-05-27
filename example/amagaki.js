const googleSheetsPlugin = require('../dist/google-sheets');

module.exports = function (pod) {
  const sheetsPlugin = googleSheetsPlugin.register(pod, {
    keyFile: '/Users/jeremydw/Downloads/madebygoog-52e1c116d139.json',
  });
  sheetsPlugin.bindCollection({
    collectionPath: '/content/strings',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    ranges: ['homepage', 'about'],
    transform: 'strings',
  });
  sheetsPlugin.saveFile({
    podPath: '/content/transformations/strings.yaml',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    range: 'homepage',
    transform: 'strings',
  });
  sheetsPlugin.saveFile({
    podPath: '/content/transformations/grid.yaml',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    range: 'items',
    transform: 'grid',
  });
  sheetsPlugin.saveFile({
    podPath: '/content/transformations/objectRows.yaml',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    range: 'items',
    transform: 'objectRows',
  });
  sheetsPlugin.saveFile({
    podPath: '/content/transformations/rows.yaml',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    range: 'items',
    transform: 'rows',
  });
};
