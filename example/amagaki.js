const googleAuthPlugin = require('./plugins/google-auth');
const googleSheetsPlugin = require('./plugins/google-sheets');

module.exports = async function (pod, options) {
  const authPlugin = googleAuthPlugin.register(pod, {
    // clientId: options.clientId,
    // clientSecret: options.clientSecret,
    //sessionSecret: options.sessionSecret,
    keyFile: '/Users/jeremydw/Downloads/madebygoog-52e1c116d139.json',
  });
  const sheetsPlugin = googleSheetsPlugin.register(pod, authPlugin);
  await Promise.all([
    sheetsPlugin.saveFile({
      podPath: '/content/partials/foo.yaml',
      spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
      range: 'homepage',
    }),
    sheetsPlugin.bindCollection({
      collectionPath: '/content/foo',
      spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
      ranges: ['homepage', 'about'],
    }),
  ]);

  const nunjucks = pod.plugins.get('NunjucksPlugin');
  nunjucks.addFilter('jsonify', value => {
    return JSON.stringify(value);
  });
};
