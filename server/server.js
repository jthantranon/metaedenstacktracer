/**
 * Created by john.thantranon on 6/24/2015.
 */
console.log('hello world from js/main.js');

var wsConnection = require('./ws-connection.js');

function onClientConnected(client) {
    console.log('Client connected');
    client.sendMessage(
        "Hello Client, this is Server, you've connected to me!"
    );
    client.sendMessage(JSON.stringify({
        type: 'test'
    }));
    client.sendMessage(JSON.stringify([{
        type: 'test'
    }]));
}


function onClientMessage(client, message) {
    console.log(message);
}

function onClientClosed(client) {
}

wsConnection.clientConnected(onClientConnected);
wsConnection.clientMessage(onClientMessage);
wsConnection.clientClosed(onClientClosed);

var portList = {
    1: '8080',
    2: '8181'
};
var portSelect      = null, // CHANGE PORT HERE select from portList above.
    portSelected    = portList[portSelect] || '8080';

portSelect ? console.log('PORT OVERRIDE ON. [' + portSelected + ']') : console.log('Port Override Off: Using Default 8080');
wsConnection.start(portSelected);