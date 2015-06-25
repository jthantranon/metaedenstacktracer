var webSocket = require('ws');
var wss = null;
var clientConnectedCallback = null;
var clientMessageCallback = null;
var clientClosedCallback = null;

exports.start = function (port) {
   wss = new webSocket.Server({ port: port });
    wss.on('connection', function connection(ws) {
        var client = {
            sendMessage: function (data) {
                ws.send(data);
            }
        };
        if (clientConnectedCallback)
            clientConnectedCallback(client);
        ws.on('message', function incoming(message) {
            if (clientMessageCallback){
                clientMessageCallback(client, message);
            }
        });
        ws.on('close', function (data) {
            if (clientClosedCallback)
                clientClosedCallback(client, data);
        });
    });
    console.log('Web Socket Server listening on: ' + port);
};
exports.clientConnected = function (callback) {
    clientConnectedCallback = callback;
};
exports.clientMessage = function (callback) {
    clientMessageCallback = callback;
};
exports.clientClosed = function (callback) {
    clientClosedCallback = callback;
};
exports.stop = function () {
    wss.close();
};