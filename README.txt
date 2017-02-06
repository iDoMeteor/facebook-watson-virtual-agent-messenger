Facebook Messenger Conversational Agent with IBM Bluemix Watson Virtual Agent


--- TO USE ---

If acquired from Github:
  Copy config/default.json to config/production.json after setting & before deploying
  Run 'npm install'
To get bot ID:
  Set all values in config/default.json appropriately
    or
  cp config/production.json config/default.json
  node get-watson-bot-id.js
Then:
  Set all values in config/production.json appropriately
  Deploy to an Nginx/Passenger server
  Hope Watson VA API has been fixed

--- REQUIREMENTS ---

  Facebook
    create fb page
    create fb app
    select apps for messenger
    click settings under messenger
    assign page to app
    copy page access token to config/default.json
    setup webhooks
    enter url (domain.com/webhook)
    enter validation token
    copy validation token to config/default.json
    select messages & messages_postback
    subscribe your webhook to the page events
    App Review for Messenger / pages_messaging
    app icon / priv url

  Server
    copy code to server
    create load balancer & ssl
    add vhost
    change node version & root in vhost config
    switch server to node 4.1.2
    cd to app root
    npm install
    restart nginx
    test domain/ & https://domain/webhook

  Facebook
    verify webhook
    
  Watson VA
    get credentials


-- KEYS --

  fb page url: https://www.facebook.com/Watson-Agent-209560466179456/
  fb page id: 209560466179456
  fb page access token: EAAZAIxCqo5r4BAGMpmjX1qZBEUmcoZAjexQeCo9vYGPBTlxeZCLf4w9sAZCuhOO6YxIU79bOy4rZBlBijsQUaMIfQCpXV0TTgIQPvd0NjHh6zVu5hn0ClpkXTEuht7fiF0WT6kVdHQ6BEWXnUhVrZAfZAdJqAOXe84vW39M310ktpibW9qz9xkhh
  fb callback url: http://agent.idometeor.com/webhook
  fb verify token: qhf873486q3tg87frvyh
  fb app id: 1768857226766014
  fb app secret: 062f9478eb2bfbf6157d84c3f0768254

  watson bot id: 0ae70926-4569-4e49-98a6-477b6064914b
  watson key: 46e91a77-e098-413c-b903-1f23c6598bea
  watson secret: tX8oV3rB4cC2fF4xP3aJ2mC0nR4iT8dY5kA3oE1fS0rX7qV5aV


--- SDK Authorization Failure ---

  App 25797 stdout: DEBUG:
  App 25797 stdout: Bot ID: 0ae70926-4569-4e49-98a6-477b6064914b
  App 25797 stdout: Watson Key: 46e91a77-e098-413c-b903-1f23c6598bea
  App 25797 stdout: Watson Secret: tX8oV3rB4cC2fF4xP3aJ2mC0nR4iT8dY5kA3oE1fS0rX7qV5aV
  App 14611 stderr: Request failed: d68eda1a-c725-455a-a5d6-68a339ee464a
  App 14611 stderr: Error starting to Watson:
  App 14611 stderr: { [Error: Unauthorized] status: 401 }


--- DIRECT REQUEST VERSION ---

Example DB Records:

  { "_id" : ObjectId("5897fd9720c37a3a4a78d4c8"), "senderID" : "1209039725876061", "type" : "inquiry", "message" : "test", "dialogID" : "f2457d1b-c698-4f4a-93b8-c14f59b7aa92", "stamp" : ISODate("2017-02-06T04:37:43.754Z") }
  { "_id" : ObjectId("5897fd9720c37a3a4a78d4c9"), "senderID" : "1209039725876061", "type" : "response", "dialogID" : "f2457d1b-c698-4f4a-93b8-c14f59b7aa92", "message" : "Hi my name is Virtual Agent. I am here to answer questions about our company. What can I help you with?", "stamp" : ISODate("2017-02-06T04:37:43.759Z") }

Nginx/Passenger Logs:

  App 13693 stdout: Watson Messenger is running on port 5000
  App 13693 stdout: Processing post request for /webhook
  App 13693 stdout: Received message for user 1209039725876061 and page 209560466179456 at 1486355102688 with message:
  App 13693 stdout: {"mid":"mid.1486355102688:df47e92897","seq":365,"text":"pfft"}
  App 13693 stdout: Sending a read receipt to mark message as seen
  App 13693 stdout: Turning typing indicator on
  App 13693 stdout: Received from FB User 1209039725876061:  pfft

  ==> /var/log/nginx/access.log <==
  172.31.3.241 - - [06/Feb/2017:04:25:03 +0000] "POST /webhook HTTP/1.1" 200 2 "-" "-"

  ==> /var/log/nginx/error.log <==
  App 13693 stdout: Initating dialog for user  1209039725876061
  App 13693 stdout: Sending request for user  1209039725876061 to Watson
  App 13693 stdout: Successfully called Send API for recipient 1209039725876061
  App 13693 stdout: Successfully called Send API for recipient 1209039725876061
  App 13693 stdout: Received 1  message(s) from Watson for user 1209039725876061
  App 13693 stdout: Watson to 1209039725876061: Hi my name is Virtual Agent. I am here to answer questions about our company. What can I help you with?
  App 13693 stdout: Turning typing indicator off
  App 13693 stdout: Saved message with ID:5897faa02616aa357d9c2c24
  App 13693 stdout: Saved message with ID:5897faa02616aa357d9c2c25
  App 13693 stdout: Successfully called Send API for recipient 1209039725876061
  App 13693 stdout: Successfully sent message with id mid.1486355104617:06f8199c78 to recipient 1209039725876061
  App 13693 stdout: Processing post request for /webhook
  App 13693 stdout: Received message for user 209560466179456 and page 1209039725876061 at 1486355104617 with message:
  App 13693 stdout: {"is_echo":true,"app_id":1768857226766014,"mid":"mid.1486355104617:06f8199c78","seq":368,"text":"Hi my name is Virtual Agent. I am here to answer questions about our company. What can I help you with?"}
  App 13693 stdout: Received echo for message mid.1486355104617:06f8199c78 and app 1768857226766014 with metadata undefined

  ==> /var/log/nginx/access.log <==
  172.31.3.241 - - [06/Feb/2017:04:25:04 +0000] "POST /webhook HTTP/1.1" 200 2 "-" "-"

  ==> /var/log/nginx/error.log <==
  App 13693 stdout: Processing post request for /webhook
  App 13693 stdout: Received delivery confirmation for message ID: mid.1486355104617:06f8199c78
  App 13693 stdout: All messages before 1486355104617 were delivered.

  ==> /var/log/nginx/access.log <==
  172.31.51.255 - - [06/Feb/2017:04:25:04 +0000] "POST /webhook HTTP/1.1" 200 2 "-" "-"

  ==> /var/log/nginx/error.log <==
  App 13693 stdout: Processing post request for /webhook
  App 13693 stdout: Received message read event for watermark 1486355104617 and sequence number 0

  ==> /var/log/nginx/access.log <==
  172.31.3.241 - - [06/Feb/2017:04:25:05 +0000] "POST /webhook HTTP/1.1" 200 2 "-" "-"

  ==> /var/log/nginx/error.log <==
  App 13693 stdout: Processing post request for /webhook
  App 13693 stdout: Received message for user 1209039725876061 and page 209560466179456 at 1486355134050 with message:
  App 13693 stdout: {"mid":"mid.1486355134050:1c4c37d691","seq":371,"text":"do eet"}
  App 13693 stdout: Sending a read receipt to mark message as seen
  App 13693 stdout: Turning typing indicator on
  App 13693 stdout: Received from FB User 1209039725876061:  do eet

  ==> /var/log/nginx/access.log <==
  172.31.3.241 - - [06/Feb/2017:04:25:34 +0000] "POST /webhook HTTP/1.1" 200 2 "-" "-"

  ==> /var/log/nginx/error.log <==
  App 13693 stdout: Calling dialog resume with id: 3762f257-0462-468b-b1fc-6744febf6c80
  App 13693 stdout: Attempting to resume dialog 3762f257-0462-468b-b1fc-6744febf6c80 with user 1209039725876061
  App 13693 stdout: Sending request for user  1209039725876061 to Watson
  App 13693 stdout: Successfully called Send API for recipient 1209039725876061
  App 13693 stdout: Successfully called Send API for recipient 1209039725876061
  App 13693 stdout: Error received from Watson the body was not set; blkGetBody should come before this block (X-Request-ID: 9069c9de-ef30-4855-9ceb-abee0c57a3d2).
  App 13693 stdout: Saved message with ID:5897fabe2616aa357d9c2c26



--- SDK VERSION ---

Example DB Records:

  { "_id" : ObjectId("5897fc21cb7ead39131e72e0"), "message" : "test", "senderID" : "1209039725876061", "type" : "inquiry", "stamp" : ISODate("2017-02-06T04:31:29.795Z") }
  { "_id" : ObjectId("5897fc21cb7ead39131e72df"), "dialogID" : null, "message" : "This is a hardcoded debug message", "senderID" : "1209039725876061", "type" : "response", "stamp" : ISODate("2017-02-06T04:31:29.788Z") }


Nginx/Passenger Logs:

  ==> /var/log/nginx/error.log <==
  App 14611 stdout: Watson Messenger is running on port 5000
  App 14611 stdout: Processing post request for /webhook
  App 14611 stdout: Received message for user 1209039725876061 and page 209560466179456 at 1486355297951 with message:
  App 14611 stdout: {"mid":"mid.1486355297951:81ec571651","seq":374,"text":"test"}
  App 14611 stdout: Sending a read receipt to mark message as seen
  App 14611 stdout: Turning typing indicator on
  App 14611 stdout: Received from FB User 1209039725876061:  test
  App 14611 stdout: DEBUG:
  App 14611 stdout: Bot ID: 0ae70926-4569-4e49-98a6-477b6064914b
  App 14611 stdout: Watson Key: 46e91a77-e098-413c-b903-1f23c6598bea
  App 14611 stdout: Watson Secret: tX8oV3rB4cC2fF4xP3aJ2mC0nR4iT8dY5kA3oE1fS0rX7qV5aV
  App 14611 stdout: Received 1  message(s) from Watson for user 1209039725876061
  App 14611 stdout: Watson to 1209039725876061: This is a hardcoded debug message
  App 14611 stdout: Turning typing indicator off

  ==> /var/log/nginx/access.log <==
  172.31.3.241 - - [06/Feb/2017:04:31:29 +0000] "POST /webhook HTTP/1.1" 200 2 "-" "-"

  ==> /var/log/nginx/error.log <==
  App 14611 stdout: Saved message with ID:5897fc21cb7ead39131e72df
  App 14611 stdout: Saved message with ID:5897fc21cb7ead39131e72e0
  App 14611 stdout: Successfully called Send API for recipient 1209039725876061
  App 14611 stdout: Successfully called Send API for recipient 1209039725876061
  App 14611 stdout: Successfully called Send API for recipient 1209039725876061
  App 14611 stdout: Successfully sent message with id mid.1486355489901:a10d8bba32 to recipient 1209039725876061
   - (Below is latent from SDK call immediately after hardcoded debug message)
  App 14611 stderr: Request failed: d68eda1a-c725-455a-a5d6-68a339ee464a
  App 14611 stderr: Error starting to Watson:
  App 14611 stderr: { [Error: Unauthorized] status: 401 }


--- LINKS ---

  https://agent.idometeor.com/
  https://github.com/watson-virtual-agents/client-sdk
  https://github.com/watson-virtual-agents/client-sdk/blob/master/src/sdk.js
  https://github.com/watson-virtual-agents/chat-widget
  https://github.com/watson-virtual-agents/client-sdk/blob/master/docs/JSDOCS.md
  https://github.com/watson-virtual-agents/chat-widget/blob/master/docs/DOCS.md
  https://github.com/watson-virtual-agents/chat-widget/blob/master/docs/JSDOCS.md
  https://github.com/watson-virtual-agents/chat-widget/blob/master/docs/EVENTS.md
  https://watson-virtual-agent.mybluemix.net/
  https://developer.ibm.com/api/mypage/?id=339
  https://watson-virtual-agent.mybluemix.net/bots/0ae70926-4569-4e49-98a6-477b6064914b/configure
  
  https://developer.ibm.com/api/view/id-339#doc
  https://developers.facebook.com/docs/messenger-platform/product-overview/setup
  https://github.com/fbsamples/messenger-platform-samples
  https://developers.facebook.com/apps
  https://www.facebook.com/pages/create
  https://github.com/germanattanasio/botkit-watson-conversation-multibot

