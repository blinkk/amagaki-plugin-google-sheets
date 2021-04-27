const {google} = require('googleapis');
const passport = require('passport');
const passportGoogle = require('passport-google-oauth20');
const CookieSession = require('cookie-session');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

const SCOPES = [
  'email',
  'profile',
  'https://www.googleapis.com/auth/spreadsheets',
];

class GoogleAuthPlugin {
  constructor(pod, options) {
    this.pod = pod;
    // Used with service accounts (either keyFile or auto-configured).
    this.auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    // Used with user accounts (via oauth2 flow).
    this.oauth2 = new google.auth.OAuth2(
      options.clientId,
      options.clientSecret
    );
  }
}

function register(pod, options) {
  const authPlugin = new GoogleAuthPlugin(pod, options);

  const Urls = {
    CALLBACK: '/amagaki/oauth2callback',
    ERROR: '/amagaki/error',
    LOGIN: '/amagaki/login',
  };

  let baseUrl = '';
  if (process.env.AMAGAKI_BASE_URL) {
    if (process.env.AMAGAKI_BASE_URL.startsWith('http')) {
      baseUrl = process.env.AMAGAKI_BASE_URL;
    } else {
      baseUrl = `https://${process.env.AMAGAKI_BASE_URL}`;
    }
  }

  const serverPlugin = pod.plugins.get('ServerPlugin');
  serverPlugin.register(app => {
    app.enable('trust proxy');
    passport.use(
      new passportGoogle.Strategy(
        {
          clientID: options.clientId,
          clientSecret: options.clientSecret,
          callbackURL: `${baseUrl}${Urls.CALLBACK}`,
        },
        (accessToken, refreshToken, profile, cb) => {
          authPlugin.oauth2.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          profile.accessToken = accessToken;
          profile.refreshToken = refreshToken;
          return cb(undefined, profile);
        }
      )
    );

    passport.serializeUser((user, cb) => {
      cb(null, user);
    });

    passport.deserializeUser((obj, cb) => {
      // @ts-ignore
      cb(null, obj);
    });

    const outgoingReturnToMiddleware = (req, res, next) => {
      const authOptions = {
        scope: SCOPES,
        successReturnToOrRedirect: '/',
        failureRedirect: Urls.ERROR,
        state: req.query.returnUrl || undefined,
      };
      passport.authenticate('google', authOptions)(req, res, next);
    };

    const incomingReturnToMiddleware = (req, res, next) => {
      const host = req.hostname.endsWith('localhost')
        ? `${req.hostname}:${process.env.PORT || 8080}`
        : req.hostname;
      let authOptions;
      if (req.query.state) {
        const currentUrl = new URL(
          `${req.protocol}://${host}${req.originalUrl}`
        );
        const successRedirect = currentUrl.search
          ? `${currentUrl.pathname}${currentUrl.search}`
          : currentUrl.pathname;
        authOptions = {
          scope: SCOPES,
          failureRedirect: Urls.ERROR,
          successRedirect: successRedirect,
        };
      } else {
        authOptions = {
          scope: SCOPES,
          failureRedirect: Urls.ERROR,
          successReturnToOrRedirect: '/',
        };
      }
      passport.authenticate('google', authOptions)(req, res, next);
    };

    app.use(
      CookieSession({
        name: 'amagaki.session',
        keys: [options.sessionSecret],
      })
    );
    app.use(passport.initialize());
    app.use(passport.session());
    app.get(Urls.LOGIN, outgoingReturnToMiddleware);
    app.get(Urls.CALLBACK, incomingReturnToMiddleware);
    app.get(Urls.ERROR, (req, res) => {
      res.send('Something went wrong with authentication.');
    });

    app.use('*', ensureLoggedIn(Urls.LOGIN));
  });

  return authPlugin;
}

module.exports = {
  register: register,
};
