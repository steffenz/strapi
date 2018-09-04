#!/usr/bin/env node

'use strict';

/**
 * Module dependencies
 */

// Node.js core.
const path = require('path');

// Public node modules.
const {cyan, gray} = require('chalk');
const inquirer = require('inquirer');
const fetch = require('node-fetch');
const ora = require('ora');

// Utils
const { cli } = require('strapi-utils');
const {marketplace: host, internet, getConfig} = require('../lib/utils');

/**
 * `$ strapi login`
 *
 * Connect your account to Strapi solutions.
 */

/* eslint-disable prefer-template */
/* eslint-disable no-console */
module.exports = async () => {
  await internet();

  const action = process.argv[2].split(':')[1];

  const config = await getConfig();

  if (!config.jwt) {
    console.log('⛔️ You have to be loggin.');
    process.exit();
  }

  const displayAppList = async () => {
    const loader = ora('Fetch your apps').start();

    const apps = await fetch(`${host}/application/list`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.jwt}`
      }
    })
      .then(res => res.json())
      .catch(() => {
        loader.fail('Server error, please contact support@strapi.io');
        process.exit(1);
      });

    loader.stop();

    if (apps.message) {
      loader.fail(apps.message);
      process.exit(1);
    }

    let uuid;
    try {
      const pkg = require(path.join(process.cwd(), 'package'));
      uuid = pkg.strapi.uuid;
    } catch (error) {
      // silent
    }

    if (apps.length === 0) {
      console.log(`No applications is linked to your account.\nRun ${cyan('strapi app:link')} to link you app.`);
    } else {
      apps.forEach((app) => {
        console.log(`${app.name} ${gray(`(${app.uuid})`)}${app.uuid === uuid ? ` ${cyan('current')}` : ''}`);
      });
    }
  };

  const linkApp = async () => {
    if (!cli.isStrapiApp()) {
      return console.log(`⛔️ Can only be used inside a Strapi project.`);
    }

    let pkg;
    try {
      pkg = require(path.join(process.cwd(), 'package'));
    } catch (error) {
      console.log(`⛔️ Can't find package.json file.`);
      process.exit(1);
    }

    if (!pkg.strapi || !pkg.strapi.uuid) {
      console.log(`⛔️ This application doesn't have strapi.uuid in package.json.`);
      process.exit(1);
    }

    let loader = ora('Fetch available subscriptions').start();

    let subscriptions = await fetch(`${host}/subscriptions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.jwt}`
      }
    })
      .then(res => res.json())
      .catch(() => {
        loader.fail('Server error, please contact support@strapi.io');
        process.exit(1);
      });

    loader.stop();

    const available = subscriptions.reduce((acc, subscription) => {
      if (!subscription.value.app || (subscription.value.app && subscription.value.app.uuid !== pkg.strapi.uuid)) {
        acc.push(subscription);
      }

      return acc;
    }, []);

    let subscription;
    if (available.length === 0 && subscriptions.find((subscription) => {
      return (subscriptions.value.app && subscription.value.app.uuid === pkg.strapi.uuid);
    })) {
      console.log('This app is already linked');
      process.exit(1);
    } else if (available.length === 0) {
      console.log('You have not available subscription, please visite https://strapi.io/premium');
      process.exit(1);
    } else if (subscriptions.length === 1 && !subscriptions[0].value.app) {
      subscription = subscriptions[0].value;
    } else {
      const {choise} = await inquirer.prompt([{
        type: 'list',
        name: 'choise',
        message: 'Choise the plan you subscribe:',
        choices: available,
        pageSize: available.length
      }]);

      subscription = choise;
    }

    if (subscription.app) {
      console.log(`It will lost your plugins in the other app!`);
      const confirm = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: '⛔️ Are you sure?',
      }]);
    }

    loader = ora('Link your app').start();

    const res = await fetch(`${host}/application/link`, {
      method: 'POST',
      body: JSON.stringify({
        name: pkg.name,
        uuid: pkg.strapi.uuid,
        subscription
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.jwt}`
      }
    })
      .then(res => res.json())
      .catch(() => {
        loader.fail('Server error, please contact support@strapi.io');
        process.exit(1);
      });

    loader.stop();

    console.log(res.message);
  };

  switch (action) {
    case 'list':
      await displayAppList();
      break;
    case 'link':
      await linkApp();
      break;
    default:
      console.log(`⚠️ The action ${cyan(action)} in not correct!`);
  }
};