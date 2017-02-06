/* jshint node: true, devel: true */
'use strict';

/*
 * Be sure to setup your config values before running this code. You can 
 * set them using environment variables or modifying the config file in /config.
 *
 * You can get your Watson bot ID by running 'node get-watson-bot-id.js' once
 * you've set your Watson credentials in config/default.json. This is the only
 * time config/default.json will be used so only watsonKey, watsonSecret and
 * watsonVersion need to be set here.
 *
 * This code will only work if deployed to a server reachable by Facebook,
 * therefore you will need *all* the values in config/production.json set
 * correctly.
 *
 */

const 
  bodyParser = require('body-parser'),
  config = require('config'),
  crypto = require('crypto'),
  express = require('express'),
  https = require('https'),  
  mongo = require('mongodb').MongoClient,
  request = require('request');

// Set up for the REST API
const app = express();
app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(express.static('public'));

// Set up database
const dbURL = 'mongodb://localhost:27017/watsonva';
let Conversations;
// Use connect method to connect to the Server 
mongo.connect(dbURL, function(err, db) {
  Conversations = db.collection('conversations');
});

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ? 
  process.env.MESSENGER_APP_SECRET :
  config.get('appSecret');

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
  (process.env.MESSENGER_VALIDATION_TOKEN) :
  config.get('validationToken');

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
  (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
  config.get('pageAccessToken');

// Set Watson credentials
const WATSON_BOT_ID = (process.env.WATSON_BOT_ID) ?
  (process.env.WATSON_BOT_ID) :
  config.get('watsonBotId');
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
if (!APP_SECRET) {
  console.error("Missing app secret");
  process.exit(1);
}
if (!VALIDATION_TOKEN) {
  console.error("Missing validation token");
  process.exit(1);
}
if (!PAGE_ACCESS_TOKEN) {
  console.error("Missing page access token");
  process.exit(1);
}
if (!WATSON_BOT_ID) {
  console.error("Missing Watson bot ID");
  process.exit(1);
}
if (!WATSON_KEY) {
  console.error("Missing Watson key");
  process.exit(1);
}
if (!WATSON_SECRET) {
  console.error("Missing Watson secret");
  process.exit(1);
}
if (!WATSON_VERSION) {
  console.error("Missing Watson version");
  process.exit(1);
}

/*
 * Use your own validation token. Check that the token used in the Webhook 
 * setup is the same token used here.
 *
 */
app.get('/webhook', function(req, res) {
  console.log("Processing get request for /webhook");
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});


/*
 * All callbacks for Messenger are received via POST requests. They will be 
 * sent to the same webhook. Be sure to subscribe your app to your page to 
 * receive callbacks for your page. 
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook', function (req, res) {
  console.log("Processing post request for /webhook");
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.read) {
          receivedMessageRead(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });

    // You must send back a 200, within 20 seconds, to let us know you've 
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});

/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s", 
          messageId, recipientId);
      } else {
      console.log("Successfully called Send API for recipient %s", 
        recipientId);
      }
    } else {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });  
}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about 
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function(messageID) {
      console.log("Received delivery confirmation for message ID: %s", 
        messageID);
    });
  }

  console.log("All messages before %d were delivered.", watermark);
}


// Called when a message from Facebook is received
function receivedFromFacebook(message, senderID) {
  console.log('Received from FB User ' + senderID + ': ', message);

  // Check for pre-existing dialog with user
  Conversations
    .find({senderID: senderID, dialogID: {$ne: null}}, {limit: 1})
    .toArray((error, result) => {
      if (result.length) {
        // Conversation exists, resume
        const dialogID = ('undefined' == typeof result[0].dialogID) ? null : result[0].dialogID;
        const type = 'inquiry';
        console.log('Calling dialog resume with id: ' + dialogID);
        watsonDialogResume(message, senderID, dialogID);
      } else {
        // Initiate new dialog with user
        watsonDialogInitiate(message, senderID);
      }
  });

};

// Called when a message from Watson is received
function receivedFromWatson(response, senderID) {
  if ('string' == typeof response.error) {
    console.log('Error received from Watson', response.error);
    return;
  } else {
    console.log('Received', 
                response.message.text.length || 0,
                ' message(s) from Watson for user', 
                senderID);
  }
  const dialogID = response.dialog_id || null;
  const type = 'response';
  const obj = {
    senderID: senderID,
    type: type,
  };
  if (dialogID)
    obj.dialogID = dialogID;

  // Loop over messages
  response.message.text.forEach(text => {
    console.log('Watson to', senderID + ':', text);
    obj.message = text;
    // Save to database
    saveMessage(obj);
    // Send back to Messenger
    sendTextMessage(senderID, text);

  });

  // Turn off FB typing indicator
  sendTypingOff(senderID);

};

/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message' 
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some 
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've 
 * created. If we receive a message with an attachment (image, video, audio), 
 * then we'll simply confirm that we've received the attachment.
 * 
 */
function receivedMessage(event) {

  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (isEcho) {
    // Log echo messages to console
    console.log("Received echo for message %s and app %d with metadata %s", 
      messageId, appId, metadata);
    return;
  }

  if (messageText) {
    sendReadReceipt(senderID);
    sendTypingOn(senderID);
    receivedFromFacebook(messageText, senderID);
  } else if (messageAttachments) {
    sendTextMessage(senderID, "I'm sorry, I cannot process message attachments.");
  }

}


/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 * 
 */
function receivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;

  console.log("Received message read event for watermark %d and sequence " +
    "number %d", watermark, sequenceNumber);
}

// Save a message to the database
function saveMessage(obj) {

  // Add time stamp
  if ('object' == typeof obj) {
    obj.stamp = new Date();
  }

  // Save to database
  Conversations.insert(obj, (error, result) => {
    if (error)
      console.error('Could not save message:' + 
                    JSON.stringify(error, null, 2));
    if (result)
      console.log('Saved message with ID:' + result.ops[0]._id);
  });

};

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {
  console.log("Sending a read receipt to mark message as seen");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "mark_seen"
  };

  callSendAPI(messageData);
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
    }
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {
  console.log("Turning typing indicator off");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_off"
  };

  callSendAPI(messageData);
};

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {
  console.log("Turning typing indicator on");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_on"
  };

  callSendAPI(messageData);
}

/*
 * Verify that the callback came from Facebook. Using the App Secret from 
 * the App Dashboard, we can verify the signature that is sent with each 
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an 
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

// Initiate Watson Virtual Agent dialog with new user
function watsonDialogInitiate(message, senderID) {

  console.log('Initating dialog for user ', senderID);

  // Configure Watson Virtual Agent request options
  const dialogRequestOptions = {
    "method": "POST",
    "hostname": "api.ibm.com",
    "port": null,
    "path": "/virtualagent/run/api/v1/bots/" +
      WATSON_BOT_ID +
      "/dialogs?version=" + 
      WATSON_VERSION,
    "body": {
      message: message
    },
    "headers": {
      "accept": "application/json",
      "content-type": "application/json",
      "X-IBM-Client-Id": WATSON_KEY,
      "X-IBM-Client-Secret": WATSON_SECRET,
    }
  };
  // Call Watson
  watsonRequest(dialogRequestOptions, senderID);

};

// Resume Watson Virtual Agent dialog with known user
function watsonDialogResume(message, senderID, dialogID) {

  console.log('Attempting to resume dialog', dialogID, 'with user', senderID);

  // Safety check
  if (!dialogID) {
    // Initiate new dialog with user
    watsonDialogInitiate(message, senderID);
    return;
  }

  // Configure Watson Virtual Agent request options
  const dialogRequestOptions = {
    "method": "POST",
    "hostname": "api.ibm.com",
    "port": null,
    "path": '/virtualagent/run/api/v1/bots/' +
      WATSON_BOT_ID +
      '/dialogs/' +
      dialogID +
      '/messages?version=' + 
      WATSON_VERSION,
    "body": {
      message: message
    },
    "headers": {
      "accept": "application/json",
      "content-type": "application/json",
      "X-IBM-Client-Id": WATSON_KEY,
      "X-IBM-Client-Secret": WATSON_SECRET,
    }
  };

  // Call Watson
  watsonRequest(dialogRequestOptions, senderID);

};

function watsonRequest (options, senderID) {

  console.log('Sending request for user ', senderID, 'to Watson');

  const dialogRequest = https.request(options, function (res) {
    let chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {

      // Assemble request and pull dialog ID to trace conversation origin
      const watsonResponse = Buffer.concat(chunks);
      const watsonResponseData = JSON.parse(watsonResponse);
      const dialogID = watsonResponseData.dialog_id || null;
      const message = options.body.message || null;
      const type = 'inquiry';
      const obj = {
        senderID: senderID,
        type: type,
        message: message,
      };
      if (dialogID)
        obj.dialogID = dialogID;

      // Save to database
      saveMessage(obj);

      // Send back to Facebook
      receivedFromWatson(watsonResponseData, senderID);

    });
  });

  dialogRequest.end();

}

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid 
// certificate authority.
app.listen(app.get('port'), function() {

  console.log('Watson Messenger is running on port', app.get('port'));

});

module.exports = app;
