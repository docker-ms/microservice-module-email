'use strict';

module.exports = (consulKVEmailServerKey) => {

  if (!consulKVEmailServerKey || typeof consulKVEmailServerKey !== 'string') {
    throw new Error('Invalid consul cluster KV store key for email server info.');
  }

  const consul = require('microservice-consul');
  const utils = require('microservice-utils');

  const Promise = require('bluebird');

  return utils.pickRandomly(consul.agents).kv.get(consulKVEmailServerKey).then((res) => {
    if (!res) {
      return Promise.reject('No email server record found in consul kv store by this key.');
    }

    const emailServerInfo = JSON.parse(res.Value);

    const nodemailer = require('nodemailer');

    const baseOpts = {
      secure: false,
      ignoreTLS: true
    };

    const mailers = emailServerInfo.reduce((acc, curr) => {
      acc.push({
        mailer: nodemailer.createTransport(Object.assign(utils.copyWithoutProperties(curr, ['fromAddr']), baseOpts)),
        fromAddr: curr.fromAddr
      });
      return acc;
    }, []);

    return Promise.resolve(mailers);

  });

};


