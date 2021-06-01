'use strict';
const {Router} = require('express');

const {member: Member} = require('./models/');
const handleAsync = require('./handle-async');
const {PUBLIC_ADDRESS, ADMIN_PASSWORD, HTTP_SESSION_KEY} = process.env;

const router = Router();

router.get('/', oidc.ensureAuthenticated(), handleAsync(async (req, res) => {
  res.render('admin/index', {members: await Member.findAll({ order: [['createdAt', 'ASC']] })});
}));

module.exports = router;
