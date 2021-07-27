'use strict';
const okta = require('@okta/okta-sdk-nodejs')
const { ExpressOIDC } = require('@okta/oidc-middleware')

const {
    OKTA_DOMAIN, OKTA_CLIENT_ID, OKTA_CLIENT_SECRET, OKTA_USER_PROFILE_TOKEN,
    PUBLIC_ADDRESS, DEBUG_NO_OKTA, DEBUG_NO_SERVICES
} = process.env;

var OktaWrapper = function() {
    this.client = null;
    this.oidc = null;
    this.ensureAuthenticated = null;
};

OktaWrapper.prototype.init = function() {
    this.makeClient(OKTA_DOMAIN, OKTA_USER_PROFILE_TOKEN);
    this.makeOidc();
    this.getAuthFn();
};

OktaWrapper.prototype.oktaEnabled = function() {
    return DEBUG_NO_OKTA != "true" &&
        DEBUG_NO_OKTA != "True" &&
        DEBUG_NO_SERVICES != "true" &&
        DEBUG_NO_SERVICES != "True";
};

OktaWrapper.prototype.makeClient = function(orgUrl, token) {
    if (this.client == null)
        this.client = new okta.Client({
            orgUrl: orgUrl,
            token: token,
        });

    return this.client;
};

OktaWrapper.prototype.makeOidc = function() {
    if (this.oidc == null)
        this.oidc = new ExpressOIDC({
            issuer: `${OKTA_DOMAIN}/oauth2/default`,
            client_id: OKTA_CLIENT_ID,
            client_secret: OKTA_CLIENT_SECRET,
            redirect_uri: `${PUBLIC_ADDRESS}/authorization-code/callback`,
            scope: 'openid profile',
        });


    return this.oidc;
}

OktaWrapper.prototype.getAuthFn = function() {
    this.ensureAuthenticated = this.makeOidc().ensureAuthenticated;

    if (!this.oktaEnabled()) {
        this.ensureAuthenticated = () => {
            return (req, res, next) => {
                debug("Bypassing admin auth");
                return next();
            }
        };
    }

    return this.ensureAuthenticated;
};

module.exports = OktaWrapper;
