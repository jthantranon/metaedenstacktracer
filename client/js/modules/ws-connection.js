function WSConnection($scope) {
    var self = this;

    var hostname = 'localhost:8080';
    self.connection = new WebSocket('ws://' + hostname, ['soap', 'xmpp']);
    self.router = new WSRouter($scope);

    self.send = function (message) {
        self.connection.send(JSON.stringify(message));
    };

    // When the connection is open, send some data to the server
    self.connection.onopen = function () {
        console.log('ws connection opened');
        self.send("Hi, I'm a client, and I've connected!");
    };

    // Log errors
    self.connection.onerror = function (error) {
        console.log('WebSocket Error ' + error);
    };

    // Log messages from the server]
    self.connection.onmessage = function (e) {
        self.router.process(e);
    };

}