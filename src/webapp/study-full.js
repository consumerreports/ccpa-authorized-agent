'use strict';

const {ENABLE_STUDY_FULL} = process.env;

const studyFullCheck = (req, res, openCb) => {
    if (ENABLE_STUDY_FULL == 'true' ||
        ENABLE_STUDY_FULL == 'True' ||
        ENABLE_STUDY_FULL == '1') {
        res.render('full');
    } else {
        openCb();
    }
};

module.exports = { studyFullCheck };
