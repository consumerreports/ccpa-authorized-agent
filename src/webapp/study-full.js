'use strict';

const {ENABLE_STUDY_FULL} = process.env;

const studyFullCheck = (req, res, openCb) => {
  if (ENABLE_STUDY_FULL == undefined) {
    return openCb();
  } else if (ENABLE_STUDY_FULL.toLowerCase() == 'true') {
    return res.render('full');
  } else if (ENABLE_STUDY_FULL == '1') {
    return res.render('full');
  } else {
    return openCb();
  }
};

module.exports = { studyFullCheck };
