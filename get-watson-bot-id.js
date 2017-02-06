/* jshint node: true, devel: true */
'use strict';

/*
 * Be sure to setup your config values before running this code. You can 
 * set them using environment variables or modifying the config file in /config.
 *
 */

// Imports
const 
  config = require('config'),
  https = require('https'),  
  request = require('request'),
  watson = require('@watson-virtual-agent/client-sdk');

// Get Watson keys & version
const WATSON_KEY = (process.env.WATSON_KEY) ?
  (process.env.WATSON_KEY) :
  config.get('watsonKey');
const WATSON_SECRET = (process.env.WATSON_SECRET) ?
  (process.env.WATSON_SECRET) :
  config.get('watsonSecret');
const WATSON_VERSION = (process.env.WATSON_VERSION) ?
  (process.env.WATSON_VERSION) :
  config.get('watsonVersion');

// Check configuration values exist
if (!(WATSON_KEY && 
      WATSON_SECRET && 
      WATSON_VERSION)) {
  console.error("Missing config values");
  process.exit(1);
}

// Configure Watson Virtual Agent bot ID request
const botRequestOptions = {
  "method": "GET",
  "hostname": "api.ibm.com",
  "port": null,
  "path": "/virtualagent/run/api/v1/bots?version=" + WATSON_VERSION,
  "headers": {
    "accept": "application/json",
    "content-type": "application/json",
    "X-IBM-Client-Id": WATSON_KEY,
    "X-IBM-Client-Secret": WATSON_SECRET,
  }
};

// Watson Virtual Agent ID placeholder

// Acquire Watson Virtual Agent bot ID
const botRequest = https.request(botRequestOptions, function (res) {
  let chunks = [];
  let watsonResponse;
  let watsonResponseObject;
  let watsonResponseData;
  let watsonBotId;

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {

    // Assemble bot ID from request stream
    watsonResponse = Buffer.concat(chunks);
    watsonResponseData = JSON.parse(watsonResponse);
    watsonResponseObject = watsonResponseData[0];
    watsonBotId = watsonResponseObject.bot_id;
    console.log('Watson Bot ID: ' + watsonBotId);

  });
});

botRequest.end();

