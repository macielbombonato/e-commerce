import Auth0Lock from 'auth0-lock';

import { AUTH_CONFIG } from './auth0-variables';
import createHistory from 'history/createBrowserHistory';

const history = createHistory({
  forceRefresh: true
});

export default class Auth {
  lock = new Auth0Lock(AUTH_CONFIG.clientId, AUTH_CONFIG.domain, { // eslint-disable-line
    oidcConformant: true,
    autoclose: true,
    auth: {
      redirectUrl: AUTH_CONFIG.callbackUrl,
      responseType: 'token id_token',
      audience: `https://${AUTH_CONFIG.domain}/userinfo`,
      params: {
        scope: 'profile email'
      }
    }
  });

  constructor () {
    this.handleAuthentication();
    // binds functions to keep this context
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.isAuthenticated = this.isAuthenticated.bind(this);
  }

  login () {
    // Call the show method to display the widget.
    this.lock.show();
  }

  handleAuthentication () {
    // Add a callback for Lock's `authenticated` event
    this.lock.on('authenticated', this.setSession.bind(this));
    // Add a callback for Lock's `authorization_error` event
    this.lock.on('authorization_error', (err) => {
      console.log(err);
      alert(`Error: ${err.error}. Check the console for further details.`);
      history.replace('/');
    });
  }

  setSession (authResult) {
    if (authResult && authResult.accessToken && authResult.idToken) {
      // Set the time that the access token will expire at
      let expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
      localStorage.setItem('access_token', authResult.accessToken);
      localStorage.setItem('id_token', authResult.idToken);
      localStorage.setItem('expires_at', expiresAt);

      this.lock.getUserInfo(authResult.accessToken, (error, profile) => {
        if (!error) {
          localStorage.setItem('profile', JSON.stringify(profile));
        }

        history.goBack();
      });
    }
  }

  logout () {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('profile');
  }

  isAuthenticated () {
    // Check whether the current time is past the
    // access token's expiry time
    let expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  }
}
