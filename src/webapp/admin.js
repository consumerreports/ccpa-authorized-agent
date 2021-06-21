'use strict';
const {Router} = require('express');

const {member: Member} = require('./models/');
const handleAsync = require('./handle-async');
const {PUBLIC_ADDRESS, ADMIN_PASSWORD, HTTP_SESSION_KEY} = process.env;

const {oidc: oidc} = require('./okta.js');
const router = Router();

router.get('/', oidc.ensureAuthenticated(), handleAsync(async (req, res) => {
  res.render('admin/index', {members: await Member.findAll({ order: [['createdAt', 'ASC']] })});
}));

router.get('/sign-out', oidc.ensureAuthenticated(), handleAsync(async (req, res) => {
  req.logout();
  res.redirect('/');
}));

module.exports = {router: router};
