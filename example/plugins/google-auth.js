const {google} = require('googleapis');

// TODO: Include scopes in options.
const SCOPES = [
  'email',
  'profile',
  'https://www.googleapis.com/auth/spreadsheets',
];

class GoogleAuthPlugin {
  constructor(pod, options) {
    this.pod = pod;
    // Used with service accounts (either keyFile or auto-configured).
    this.authClient = new google.auth.GoogleAuth({
      scopes: SCOPES,
      keyFile: options.keyFile,
    });
  }
}

function register(pod, options) {
  // `pod.plugins.register` makes the plugin accessible via
  // `pod.plugins.get('GoogleAuthPlugin')`.
  pod.plugins.register(GoogleAuthPlugin, options);
  return pod.plugins.get('GoogleAuthPlugin');
}

module.exports = {
  register: register,
};
