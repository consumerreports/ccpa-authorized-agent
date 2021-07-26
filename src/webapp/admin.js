'use strict';
const {Router} = require('express');
const debug = require('debug')('admin');

const {member: Member} = require('./models/');
const handleAsync = require('./handle-async');
const {PUBLIC_ADDRESS, HTTP_SESSION_KEY, DEV_NO_OKTA} = process.env;

const router = Router();

// if DEV_NO_OKTA is in environment, the admin router will bypass auth...
var authFnFactory = () => {
    return (req, res, next) => {
        debug("Bypassing admin auth");
        return next();
    }
};
if (DEV_NO_OKTA == undefined || DEV_NO_OKTA == "") {
    const {oidc: oidc} = require('./okta.js');
    authFnFactory = () => {
        return oidc.ensureAuthenticated()
    };
}

router.get('/', authFnFactory(), handleAsync(async (req, res) => {
    res.render('admin/index', {members: await Member.findAll({ order: [['createdAt', 'ASC']] })});
}));

router.get('/sign-out', authFnFactory(), handleAsync(async (req, res) => {
    req.logout();
    res.redirect('/');
}));

module.exports = {router: router};
