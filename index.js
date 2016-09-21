
var Socket = require('./socket.js');

module.exports = function (options) {

  var chatClient = Socket(options);
  chatClient.authorize = function (data) {
    return chatClient.run('authorize', data);
  };
  chatClient.create = function (data) {
    return chatClient.run('create', data);
  };
  chatClient.get = function (data) {
    return chatClient.run('get', data);
  };
  chatClient.read = function (data) {
    return chatClient.run('read', data);
  };
  return chatClient;

};
