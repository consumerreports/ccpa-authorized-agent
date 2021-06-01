'use strict';
const okta = require('@okta/okta-sdk-nodejs')

const client = new okta.Client({
  orgUrl: process.env.OKTA_ORG_URL,
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

module.exports = { client, middleware }
