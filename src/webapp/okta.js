'use strict';
const okta = require('@okta/okta-sdk-nodejs');
const { ExpressOIDC } = require('@okta/oidc-middleware');
const debug = require('debug')('okta');

const {DEBUG_NO_OKTA, DEBUG_NO_SERVICES} = process.env;

var Wrapper = function() {
    this._client = null;
    this._middleware = null;
    this._oidc = null;
};

Wrapper.prototype.oktaEnabled = function () {
    if (DEBUG_NO_OKTA == "true" || DEBUG_NO_OKTA == "True")
        return false;
    if (DEBUG_NO_SERVICES == "true" || DEBUG_NO_SERVICES == "True")
        return false;

    return true;
};

Wrapper.prototype.client = function() {
    if (this._client == null) {
        this._client = new okta.Client({
            orgUrl: process.env.OKTA_DOMAIN,
            token: process.env.OKTA_USER_PROFILE_TOKEN,
        });
    }

    return this._client;
};

Wrapper.prototype.oidc = function() {
    if (this._oidc == null) {
        this._oidc = new ExpressOIDC({
            issuer: `${process.env.OKTA_DOMAIN}/oauth2/default`,
            client_id: process.env.OKTA_CLIENT_ID,
            client_secret: process.env.OKTA_CLIENT_SECRET,
            redirect_uri: `${process.env.PUBLIC_ADDRESS}/authorization-code/callback`,
            scope: 'openid profile',
        });
    }

    return this._oidc;
}

Wrapper.prototype.middleware = function() {
    if (this._middleware == null) {
        this._middleware = async (req, res, next) => {
            debug(`is_auth_fn ${req.isAuthenticated}`)
            debug(`is_auth? ${(req.isAuthenticated && req.isAuthenticated())}`)
            debug(`session? ${req.session}`)
            debug(`session passport? ${Object.keys(req.session.passport)}`)
            debug(`session user? ${req.session.user}`)

            if (req.userinfo) {
                try {
                    // req.user in the handlers will have user context now!
                    req.user = await this.client().getUser(req.userinfo.sub)
                } catch (error) {
                    console.log(error)
                }
            }
            next()
        }
    }

    debug(`using middleware? ${this._middleware}`)
    return this._middleware;
}

Wrapper.prototype.authFunction = function() {
    if (this._authFn == null) {
        if (this.oktaEnabled()) {
            this._authFn = this.oidc().ensureAuthenticated();
        } else {
            this._authFn = (req, res, next) => {
                debug('Bypassing okta auth!');
                next();
            };
        }
    }

    debug(`authFn = ${this._authFn}`);
    return this._authFn;
}

Wrapper.prototype.ensureAuthenticated = function() {
    debug(this.oidc().context);
    return this.authFunction()
};

module.exports = Wrapper;
