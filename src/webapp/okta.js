'use strict';
const okta = require('@okta/okta-sdk-nodejs')
const { ExpressOIDC } = require('@okta/oidc-middleware')

const makeClient = (orgUrl, token) => {
    return new okta.Client({
        orgUrl: orgUrl,
        token: token,
    })
};

const middleware = async (req, res, next) => {
    var client = makeClient(
        process.env.OKTA_DOMAIN,
        process.env.OKTA_USER_PROFILE_TOKEN
    );
    if (req.userinfo) {
        try {
            // req.user in the handlers will have user context now!
            req.user = await client.getUser(req.userinfo.sub)
        } catch (error) {
            console.log(error)
        }
    }

    next()
}

// wrap this in a function so that local instances can be mocked
const oidc = new ExpressOIDC({
    issuer: `${process.env.OKTA_DOMAIN}/oauth2/default`,
    client_id: process.env.OKTA_CLIENT_ID,
    client_secret: process.env.OKTA_CLIENT_SECRET,
    redirect_uri: `${process.env.PUBLIC_ADDRESS}/authorization-code/callback`,
    scope: 'openid profile',
});

module.exports = { client, middleware, oidc }
