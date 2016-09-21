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

var chatClient = ChatClient({
  url: 'ws://localhost:4001',
  onOpen(){
    chatClient.authorize({
      token: 123
    }).then(()=>{
      chatClient.get({ limit: 10 }).then((chatsMessages) => {
        console.log('some old chat messages:', chatsMessages);
      });
    }).catch(()=>{
      console.log('authorization failed!');
    });
  }
});
chatClient.on('chatMessage', (msg)=>{
  console.log('got message:', msg);
});
```
