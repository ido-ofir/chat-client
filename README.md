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

// a ChatClient instance is an extended native WebSocket.
var chatClient = ChatClient({ url: 'ws://localhost:4001' });

// wait for the socket to be opened.
chatClient.whenOpened(()=>{
  
  // then try to get authorization from the chat server.
  chatClient.authorize({ token: 123 }).then(()=>{
    
    // get some old messages
    chatClient.get({ limit: 10 }).then((chatMessages) => {
    
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
      to: 'someUserId',   // 'to' is the only required property. the rest is up to you.
      type: 'text',
      value: 'Hi!'
    };
    
    chatClient.create(newMesssage).then((msg) => {
    
      console.log('message sent');
      
    }).catch((err) => {
    
      console.log('failed to send message', err);
      
    });
    
  }).catch(()=>{
  
    console.log('authorization failed!');
    
  });
  
});

```
