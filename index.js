
var q = require('q');

function ChatClient(options) {

  this.options = options || {};
  this.requests = [];
  this.id = 0;
  this.queue = [];
  this.isConnected = false;
  this.events = {};

  if(options.url){
    this.connect(options.url);
  }

}

ChatClient.prototype = {
    connect(url, cb){

      var chatClient = this;
      if(chatClient.options.log){
        console.log('chat-client - connecting socket');
      }
      if(chatClient.socket){
        chatClient.socket.close();
      }
      var { actions, onOpen, onError, onMessage, onClose } = chatClient.options;
      var socket = new WebSocket(url);
      chatClient.socket = socket;
      chatClient.url = url;

      socket.onopen = function(){

        if(chatClient.options.log){
          console.log('chat-client - socket opened');
        }
        chatClient.isConnected = true;
        if(onOpen) onOpen(socket);
        if(cb) cb(socket);
        if(chatClient.queue.length){
          chatClient.queue.map(cb => cb());
          chatClient.queue.length = 0;
        }
        chatClient.emit('open');

      };



      socket.onclose = function(){

        if(chatClient.options.log){
          console.log('chat-client - socket closing');
        }
        chatClient.isConnected = false;
        if(onClose) onClose(socket);
        chatClient.emit('close');

      };

      socket.onerror = function(){

        if(chatClient.options.log){
          console.log('chat-client - error:', json);
        }
        chatClient.isConnected = false;
        if(onError) onError(socket);
        chatClient.emit('error');

      };

      socket.onmessage = function(msg){

        var json = JSON.parse(msg.data);
        if(chatClient.options.log){
          console.log('chat-client - got:', json);
        }
        if(json.type) { // emit an event with the name of the action.
          chatClient.emit(json.type, json.data);
        }
        else {  // action was initiated by the client, return to the initiating callback.
          var requests = chatClient.requests;
          for (var i = 0; i < requests.length; i++) {
            if(requests[i].id === json.id){
              if(json.error) {
                if(chatClient.options.log){
                  console.log('chat-client - rejecting promise', json.error);
                }
                requests[i].promise.reject(json.error);
              }
              else {
                if(chatClient.options.log){
                  console.log('chat-client - resolving promise', json.data);
                }
                requests[i].promise.resolve(json.data);
              }
              requests.splice(i, 1);
              break;
            }
          }
        }
        chatClient.emit('message', json);  // in any case, emit a generic 'message' event.

      };

    },

    close(){

      if(this.socket){
        this.socket.close();
      }

    },

    on(eventName, listener){  // add a listener to 'eventName', return false in listener to stop the event.

      var event = this.events[eventName];
      if (!event) {
          event = this.events[eventName] = {listeners: []};
      }
      event.listeners.push(listener);
      return this;

    },
    off(eventName, listener){   // remove a listener.

      if (!eventName){   // calling off() with no arguments removes all listeners for all events.
        this.events = {};
      }
      else if (!listener){    // calling off('eventName') with no listener removes all event listeners for 'eventName'.
        delete this.events[eventName];
      }
      else{   // calling off('eventName', listener) will only remove listener.
        var event = this.events[eventName];
        if (event) {
            event.listeners = event.listeners.filter((l)=>{
              return (l === listener);
            });
            if (!event.listeners.length) delete this.events[eventName];
        }
      }
      return this;

    },
    emit(eventName, ...args){  // emit a named event

      if(this.options.log){
        console.log('chat-client - emitting ' + eventName, args);
      }
      var cont, event = this.events[eventName];
      if (!event) return;
      for (var i = 0; i < event.listeners.length; i++) {
          cont = event.listeners[i].apply(null, args);
          if (cont === false) break;  // if a listener returned false, stop here.
      }
      return this;

    },
    run(type, data, promise){  // run an action on the server.

      if(!data) {
        data = {};
      }
      this.id += 1;
      var request = { type: type, data: data, id: this.id };
      var deffered = promise || q.defer();
      var stringified = JSON.stringify(request);

      if(this.options.log){
        console.log('chat-client - running server action ' + type, request);
      }

      request.promise = deffered;
      deffered.promise.catch(this.options.onError || this.error);

      this.requests.push(request);
      this.socket.send(stringified);

      return deffered.promise;

    },
    whenOpened(cb){

      if(!this.isConnected) return this.queue.push(cb);
      cb();

    },
    authorize(data) {

      return this.run('authorize', data);

    },
    send(message) {

      return this.run('create', message);

    },
    getMessages(query) {

      return this.run('getMessages', query);

    },
    read(data) {

      return this.run('read', data);

    },
    error(err){

      console.error(err);

    }
};

module.exports = ChatClient;
