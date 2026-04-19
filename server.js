var express = require('express');
var net = require('net');
var app = express();
app.use("/dist", express.static(__dirname + '/dist'));
app.use("/assets", express.static(__dirname + '/assets'));
app.use("/css", express.static(__dirname + '/css'));
app.use("/js", express.static(__dirname + '/js'));
var path = require('path');

// viewed at http://localhost:8080
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/imageEditor.html'));
});

function checkPort(port, callback) {
    var server = net.createServer();
    server.once('error', function(err) {
        if (err.code === 'EADDRINUSE') {
            callback(false);
        } else {
            callback(true);
        }
    });
    server.once('listening', function() {
        server.close();
        callback(true);
    });
    server.listen(port);
}

function startServer(port) {
    checkPort(port, function(available) {
        if (available) {
            app.listen(port, function(){
                console.log('Server running at http://localhost:' + port);
                console.log('All bundles up!');
            });
        } else {
            console.log('Port ' + port + ' is in use, trying port ' + (port + 1));
            startServer(port + 1);
        }
    });
}

startServer(8080);
