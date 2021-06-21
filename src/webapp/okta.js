'use strict';
const okta = require('@okta/okta-sdk-nodejs')

const client = new okta.Client({
  orgUrl: process.env.OKTA_DOMAIN,
  token: process.env.OKTA_USER_PROFILE_TOKEN,
})

const middleware = async (req, res, next) => {
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

const { ExpressOIDC } = require('@okta/oidc-middleware')

// wrap this in a function so that local instances can be mocked
const oidc = new ExpressOIDC({
  issuer: `${process.env.OKTA_DOMAIN}/oauth2/default`,
  client_id: process.env.OKTA_CLIENT_ID,
  client_secret: process.env.OKTA_CLIENT_SECRET,
  redirect_uri: `${process.env.PUBLIC_ADDRESS}/authorization-code/callback`,
  scope: 'openid profile',
});

module.exports = { client, middleware, oidc }
