const googleAuthPlugin = require('./plugins/google-auth');
const googleSheetsPlugin = require('./plugins/google-sheets');

module.exports = function (pod, options) {
  const authPlugin = googleAuthPlugin.register(pod, {
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    sessionSecret: options.sessionSecret,
    // serviceAccountKeyFile:
    // '/Users/jeremydw/Downloads/madebygoog-52e1c116d139.json',
  });
  const sheetsPlugin = googleSheetsPlugin.register(pod, authPlugin);
  /*
  sheetsPlugin.bindCollection({
    collectionPath: '/content/foo/',
    id: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
  });
  sheetsPlugin.bindFile({
    podPath: '/content/partials/foo.yaml',
    id: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    range: 'homepage',
  });
  */

  const nunjucks = pod.plugins.get('NunjucksPlugin');
  nunjucks.addFilter('jsonify', value => {
    return JSON.stringify(value);
  });
};
