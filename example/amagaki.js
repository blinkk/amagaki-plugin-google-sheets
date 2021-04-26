const googleSheetsPlugin = require("./plugins/google-sheets");

module.exports = function (pod) {
  googleSheetsPlugin.register(pod, {
    serviceAccountKeyFile:
      "/Users/jeremydw/Downloads/madebygoog-52e1c116d139.json",
  });

  const nunjucks = pod.plugins.get("NunjucksPlugin");
  nunjucks.addFilter("jsonify", (value) => {
    return JSON.stringify(value);
  });
};
