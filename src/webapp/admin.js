'use strict';
const {Router} = require('express');
const debug = require('debug')('admin');

const {member: Member} = require('./models/');
const handleAsync = require('./handle-async');

module.exports = function makeRouter(oktaWrapper) {
    const router = Router();

    router.get('/', oktaWrapper.ensureAuthenticated(), handleAsync(async (req, res) => {
        res.render('admin/index', {members: await Member.findAll({ order: [['createdAt', 'ASC']] })});
    }));

    router.get('/sign-out', oktaWrapper.ensureAuthenticated(), handleAsync(async (req, res) => {
        req.logout();
        res.redirect('/');
    }));

    return router;
};
