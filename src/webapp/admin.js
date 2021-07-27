'use strict';
const {Router} = require('express');
const debug = require('debug')('admin');

const {member: Member} = require('./models/');
const handleAsync = require('./handle-async');

// if DEBUG_NO_OKTA is in environment, the admin router will bypass auth...
const OktaWrapper = require('./okta.js');
const okta = new OktaWrapper();
okta.init();
const router = Router();

router.get('/', okta.ensureAuthenticated(), handleAsync(async (req, res) => {
    res.render('admin/index', {members: await Member.findAll({ order: [['createdAt', 'ASC']] })});
}));

router.get('/sign-out', okta.ensureAuthenticated(), handleAsync(async (req, res) => {
    req.logout();
    res.redirect('/');
}));

module.exports = {router: router};
