import {PluginComponent, Pod} from '@amagaki/amagaki';

import {GoogleAuth} from 'google-auth-library';
import {google} from 'googleapis';

// TODO: Include scopes in options.
const SCOPES = [
  'email',
  'profile',
  'https://www.googleapis.com/auth/spreadsheets',
];

export interface GoogleAuthPluginOptions {
  keyFile?: string;
}

export class GoogleAuthPlugin implements PluginComponent {
  private pod: Pod;
  authClient: GoogleAuth;

  constructor(pod: Pod, options: GoogleAuthPluginOptions) {
    this.pod = pod;
    // Used with service accounts (either keyFile or auto-configured).
    this.authClient = new google.auth.GoogleAuth({
      scopes: SCOPES,
      keyFile: options.keyFile,
    });
  }
}

export const register = (pod: Pod, options: GoogleAuthPluginOptions) => {
  // `pod.plugins.register` makes the plugin accessible via
  // `pod.plugins.get('GoogleAuthPlugin')`.
  pod.plugins.register(GoogleAuthPlugin, options as Record<string, any>);
  return pod.plugins.get('GoogleAuthPlugin') as GoogleAuthPlugin;
};
