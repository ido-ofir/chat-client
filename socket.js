
var q = require('q');

module.exports = function(options){

    var { url, actions, onOpen, onClose, log } = options;

    var ws = new WebSocket(url);
    var requests = [];
    var id = 0;
    var queue = [];
    var connected = false;
    ws.events = {};

    ws.on = function(eventName, listener){  // return false in listener to stop the event
      var event = this.events[eventName];
      if (!event) {
          event = this.events[eventName] = {listeners: []};
      }
      event.listeners.push(listener);
      return this;
    };

    ws.off = function(eventName, listener){
      if (!eventName){
        this.events = {};
        return this;
      }
      if (!listener){
        delete this.events[eventName];
        return this;
      }
      var event = this.events[eventName];
      if (event) {
          event.listeners = event.listeners.filter((l)=>{
            return (l === listener);
          });
          if (!event.listeners.length) delete this.events[eventName];
      }
      return this;
    };

    ws.emit = function(eventName){
      var cont, event = this.events[eventName];
      if (!event) return;
      var args = [].slice.call(arguments, 1);
      for (var i = 0; i < event.listeners.length; i++) {
          cont = event.listeners[i].apply(null, args);
          if (cont === false) break;
      }
      return this;
    };

    ws.onmessage = function(msg){
      var json = JSON.parse(msg.data);
      if(json.type) { // action was initiated by the server, run action if it exists in 'options.actions'.
        if(actions && actions[json.type]){
          actions[json.type](json.data);
        }
        else{   // if action does not exist, emit an event with the name of the action.
          ws.emit(json.type, json.data);
        }
      }
      else {  // action was initiated by the client, return to the initiating callback.
        for (var i = 0; i < requests.length; i++) {
          if(requests[i].id === json.id){
            if(requests[i].cb) requests[i].cb(json.error, json.data);
            if(json.error) requests[i].promise.reject(json.error);
            else {
              requests[i].promise.resolve(json.data);
            }
            return requests.splice(i, 1);
          }
        }
      }
      ws.emit('message', msg);  // in any case, emit a generic 'message' event.
    };

    ws.run = function(type, data, cb){
      if(data instanceof Function) {
        cb = data;
        data = {};
      }
      var request = {type: type, data: data};
      var deffered = q.defer();
      id += 1;
      request.id = id;
      request.cb = cb;
      request.promise = deffered;
      requests.push(request);
      ws.send(JSON.stringify({ type: request.type, data: request.data ,id: request.id }));
      deffered.promise.catch(err => console.error(err));
      return deffered.promise;
    };

    ws.onopen = function(){
      connected = true;
      if(onOpen) onOpen(ws);
      queue.map(cb => cb());
      queue.length = 0;
      ws.emit('open');
    };

    ws.onclose = function(){
      connected = false;
      if(onClose) onClose(ws);
      ws.emit('close');
    };

    ws.whenOpened = function(cb){
      if(!connected) return queue.push(cb);
      cb();
    }

    return ws;
};
