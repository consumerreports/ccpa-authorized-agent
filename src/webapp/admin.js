'use strict';
const {Router} = require('express');

const {member: Member} = require('./models/');
const handleAsync = require('./handle-async');
const {PUBLIC_ADDRESS, ADMIN_PASSWORD, HTTP_SESSION_KEY} = process.env;

const { ExpressOIDC } = require('@okta/oidc-middleware')
const oidc = new ExpressOIDC({
  issuer: `${process.env.OKTA_DOMAIN}/oauth2/default`,
  client_id: process.env.OKTA_CLIENT_ID,
  client_secret: process.env.OKTA_CLIENT_SECRET,
  redirect_uri: `${PUBLIC_ADDRESS}/authorization-code/callback`,
  scope: 'openid profile',
})

const router = Router();

router.get('/', oidc.ensureAuthenticated(), handleAsync(async (req, res) => {
  res.render('admin/index', {members: await Member.findAll({ order: [['createdAt', 'ASC']] })});
}));

// app.post('/sign-out', oidc.forceLogoutAndRevoke(), (req, res) => {/*nothing to do but let oid redirect*/});

router.get('/sign-out', oidc.ensureAuthenticated(), handleAsync(async (req, res) => {
  req.logout();
  res.redirect('/');
}));

module.exports = {router: router, oidc: oidc};
