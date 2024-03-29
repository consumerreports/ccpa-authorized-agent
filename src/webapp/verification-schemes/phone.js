'use strict';

const fetch = require('node-fetch');
const base64 = require('base-64');
const FormData = require('form-data');
const {DateTime} = require('luxon');
const {Op} = require('sequelize');
const {member: Member} = require('../models/');

/**
 * The number of hours to wait between sending phone reminders to any given
 * member.
 */
const PHONE_CHALLENGE_RETRY_PERIOD = 24;

/**
 * The number of hours following Member creation time to wait before ceasing to
 * send phone reminders to any given user.
 */
const PHONE_CHALLENGE_QUIT_DELAY = 72;

const {TWILIO_SERVICE_DOMAIN, TWILIO_SERVICE_ID, TWILIO_SID, TWILIO_AUTH_TOKEN, DEBUG_FAKE_SERVICES} = process.env;

module.exports = {
  name: 'phone',
  
  challenge: async member => {
    if (DEBUG_FAKE_SERVICES=='true' || DEBUG_FAKE_SERVICES=='True') {
      console.log('DEBUG_FAKE_SERVICES Flag is used. Not chalenging sms to phone #', member.phone);
    } else {
      let formData = new FormData();
      formData.append('To', member.phone);
      formData.append('Channel', 'sms');

      await fetch(
        `${TWILIO_SERVICE_DOMAIN}/v2/Services/${TWILIO_SERVICE_ID}/Verifications`,
        { 
          method: 'POST', 
          body: formData, 
          headers: {
            Authorization: `Basic ${base64.encode(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`)}`
          }
        },
      );

      member.phoneChallengeAt = DateTime.local().toISO();
      await member.save();
    }
  },

  verify: async (member, smsCode) => {
    if (DEBUG_FAKE_SERVICES=='true' || DEBUG_FAKE_SERVICES=='True') {
      console.log('DEBUG_FAKE_SERVICES Flag is used. Not verifying sms to phone #', member.phone);
    } else {
      let formData = new FormData();
      formData.append('To', member.phone);
      formData.append('Code', smsCode);

      const rawResponse = await fetch(
        `${TWILIO_SERVICE_DOMAIN}/v2/Services/${TWILIO_SERVICE_ID}/VerificationCheck`,
        { 
          method: 'POST', 
          body: formData, 
          headers: {
            Authorization: `Basic ${base64.encode(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`)}`
          }
        },
      );
      const response = await rawResponse.json();
      if (!(response && response.status === 'approved')) {
        return false;
      }
    }

    member.phoneVerified = true;
    await member.save();

    return true;
  },

  findUnverified: async () => {
    const now = DateTime.local();
    const previousChallengeTime = now.minus(
      {hours: PHONE_CHALLENGE_RETRY_PERIOD}
    ).toISO();
    const challengeQuit = now.minus({hours: PHONE_CHALLENGE_QUIT_DELAY});
  
    return Member.findAll({
      where: {
        [Op.and]: [
          {phoneVerified: false},
          {
            [Op.or]: [
              {phoneChallengeAt: null},
              {
                [Op.and]: [
                  {phoneChallengeAt: {[Op.lt]: previousChallengeTime}},
                  {createdAt: {[Op.gte]: challengeQuit}},
                ]
              }
            ]
          }
        ]
      }
    });
  },
};
