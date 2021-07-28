'use strict';
const okta = require('@okta/okta-sdk-nodejs');
const { ExpressOIDC } = require('@okta/oidc-middleware');
const debug = require('debug')('okta');

const {
    DEBUG_NO_OKTA, DEBUG_NO_SERVICES, PUBLIC_ADDRESS,
    OKTA_DOMAIN, OKTA_CLIENT_ID, OKTA_CLIENT_SECRET,
} = process.env;


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
            issuer: `${OKTA_DOMAIN}/oauth2/default`,
            client_id: OKTA_CLIENT_ID,
            client_secret: OKTA_CLIENT_SECRET,
            appBaseUrl: PUBLIC_ADDRESS,
            scope: 'openid',
            routes: {
                loginCallback: {
                    afterCallback: '/admin'
                },
                logout: {
                    // handled by this module
                    path: '/admin/sign-out'
                },
            }
        });
    }

    return this._oidc;
}

Wrapper.prototype.middleware = function() {
    if (this._middleware == null) {
        this._middleware = async (req, res, next) => {
            debug(`is_auth? ${(req.isAuthenticated && req.isAuthenticated())}`)

            if (req.userContext && req.userContext.userinfo) {
                try {
                    // req.user in the handlers will have user context now!
                    req.user = await this.client().getUser(req.userContext.userinfo.sub)
                } catch (error) {
                    console.log(error)
                }
            }
            next()
        }
    }

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

    return this._authFn;
}

Wrapper.prototype.ensureAuthenticated = function() {
    return this.authFunction()
};

module.exports = Wrapper;
