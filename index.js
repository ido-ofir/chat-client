
var q = require('q');

function ChatClient(options) {

  this.options = options || {};
  this.requests = [];
  this.id = 0;
  this.queue = [];
  this.connected = false;
  this.events = {};

  if(options.url){
    this.connect(options.url);
  }

}

ChatClient.prototype = {
    connect(url){

      var chatClient = this;
      if(chatClient.socket){
        chatClient.socket.close();
      }
      var { actions, onOpen, onError, onMessage, onClose, log } = chatClient.options;
      var socket = new WebSocket(url);
      chatClient.socket = socket;
      chatClient.url = url;

      socket.onopen = function(){

        chatClient.connected = true;
        if(onOpen) onOpen(socket);
        chatClient.queue.map(cb => cb());
        chatClient.queue.length = 0;
        chatClient.emit('open');

      };

      socket.onclose = function(){

        chatClient.connected = false;
        if(onClose) onClose(socket);
        chatClient.emit('close');

      };

      socket.onerror = function(){

        chatClient.connected = false;
        if(onError) onError(socket);
        chatClient.emit('error');

      };

      socket.onmessage = function(msg){

        var json = JSON.parse(msg.data);
        if(json.type) { // action was initiated by the server, run action if it exists in 'options.actions'.
          if(actions && actions[json.type]){
            actions[json.type](json.data);
          }
          else{   // if action does not exist, emit an event with the name of the action.
            chatClient.emit(json.type, json.data);
          }
        }
        else {  // action was initiated by the client, return to the initiating callback.
          var requests = chatClient.requests;
          for (var i = 0; i < requests.length; i++) {
            if(requests[i].id === json.id){
              if(json.error) {
                requests[i].promise.reject(json.error);
              }
              else {
                requests[i].promise.resolve(json.data);
              }
              requests.splice(i, 1);
              break;
            }
          }
        }
        chatClient.emit('message', msg);  // in any case, emit a generic 'message' event.
        
      };

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

      var cont, event = this.events[eventName];
      if (!event) return;
      for (var i = 0; i < event.listeners.length; i++) {
          cont = event.listeners[i].apply(null, args);
          if (cont === false) break;  // if a listener returned false, stop here.
      }
      return this;

    },
    run(type, data){  // run an action on the server.

      if(!data) {
        data = {};
      }
      this.id += 1;
      var request = { type: type, data: data, id: this.id };
      var deffered = q.defer();
      var stringified = JSON.stringify(request);

      request.promise = deffered;
      deffered.promise.catch(this.options.onError || this.error);

      this.requests.push(request);
      this.socket.send(stringified);

      return deffered.promise;

    },
    whenOpened(cb){

      if(!this.connected) return this.queue.push(cb);
      cb();

    },
    authorize(data) {

      return this.run('authorize', data);

    },
    send(data) {

      return this.run('create', data);

    },
    getMessages(data) {

      return this.run('getMessages', data);

    },
    read(data) {

      return this.run('read', data);

    },
    error(err){

      console.error(err);

    }
};

module.exports = ChatClient;
