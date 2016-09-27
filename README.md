# chat-client

A simple chat client to be used with <a href="https://github.com/ido-ofir/node-chat-server">node-chat-server</a>.

## Installation

```
npm install chat-client
```

## Usage

This chat client is compliant and meant to be used with <a href="https://github.com/ido-ofir/node-chat-server">node-chat-server</a>.

```js
var ChatClient = require('chat-client');

// creating a ChatClient and connecting the undelying socket.
var chatClient = new ChatClient({ url: 'ws://localhost:4001' });

// you can also connect at a later time:
  
chatClient = new ChatClient();

chatClient.connect('ws://localhost:4001');

// wait for the socket to be opened.
chatClient.whenOpened(()=>{
  
  // then get authorization from the chat server.
  // the token here is just an example as the actual authorization protocol is completely up to you.
  chatClient.authorize({ token: 123 }).then(()=>{
    
    // get some old messages
    chatClient.getMessages({ with: 'someUserId', limit: 10, skip: 0 }).then((chatMessages) => {
    
      console.log('some old chat messages:', chatMessages);
      
    }).catch((err)=>{
    
      console.log('failed to get messages', err);
      
    });
    
    // listen for incoming chat messages.
    chatClient.on('chatMessage', (msg)=>{
    
      console.log('got message:', msg);
      
      // mark a message as having been read. 
      chatClient.read(msg._id).then(ok => /* ok */ ).catch(err => /* oops.. */ );
      
    });
    
    // create a new chat message.
    var newMessage = {
      to: 'someUserOrGroupId',   // required property.
      isGroup: true,             // the server needs to know if this message is for a group.
      type: 'text',              // the rest is up to you..
      value: 'Hi!'
    };
    
    chatClient.send(newMesssage).then((msg) => {
    
      console.log('message sent');
      
    }).catch((err) => {
    
      console.log('failed to send message', err);
      
    });
    
  }).catch(()=>{
  
    console.log('authorization failed!');
    
  });
  
});

```

When creating an instance of `ChatClient` you may pass an 'options' object to it, containing some or all of the following fields:

* **url** - String - if preset will connect the underlying socket to `url`.
* **onOpen** - Function - will be called when the socket opens.
* **onError** - Function - will be called when the socket cannot connect or is closed unexpectedly.
* **onMessage** - Function - will be called on any incoming socket message.
* **onClose** - Function - will be called whenever the socket closes.

## Methods

* **connect** - (url: String) - connects the underlying socket to `url`.
* **on** - (eventName: String, listener: Function) - binds `listener` to the `eventName` event.
* **off** - (eventName: String, listener: Function) - unbinds `listener` to the `eventName` event. if `listener` is not provided, all listeners for `eventName` will be removed. if both `listener` and `eventName` are not supplied, all listeners for all events will be removed.
* **emit** - (eventName: String, ...args) - emit the `eventName` event. ant additional argument will be passed to bound listeners.
* **run** - (type: String, data: Object) => Promise -  runs an action on the server. `type` is the name of the action on the server. `data` will be passed to the action on the server. a deffered promise is returned from this function. the promise will be resolved or rejected based on the server action's response.
* **whenOpened** - (callback: Function) - runs `callback` whenever the socket opens. note that if the socket is already opened, `callback` will run immediately.
* **authorize** - (data: Object) - runs the `authorize` action on the server, passing `data`.
* **send** - (message: Object) - sends a chat message to the server. this will run the `create` action on the server, passing `data`.
* **read** - (data: Object) - mark a chat message as having been read. this will run the `read` action on the server, passing `data`.
* **error** - (err: any) - a default error handler which just log the error to the console. if you pass `onError` to the constructor it will override this function.

## Events

* **message** - fired for every incoming socket message.
* **open** - fired whenever the socket openes.
* **close** - fired whenever the socket closes.
* **error** - fired when the socket cannot connect or is closed unexpectedly.
* **chatMessage** - fired for every incoming chat message.

