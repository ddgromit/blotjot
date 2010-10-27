var sys = require('sys');
var http = require('http');
var events = require('events');
var express = require('express');
var connect = require('connect');

var Artist = require('./artist').Artist;
var room = require('./room');

var app = express.createServer(
    connect.staticProvider(__dirname + "/public")
);
function agentType(agent) {
    var agent = agent.toLowerCase();
    if (agent.indexOf("ipod") >= 0) return "ipod";
    if (agent.indexOf("iphone") >= 0) return "iphone";
    if (agent.indexOf("ipad") >= 0) return "ipad";
    return "browser";
}
function renderIOS(req,res) {
    var board_type = agentType(req.headers['user-agent']);
    res.render('board-ios.jade', {
        layout: false,
        locals: {
            'room_id':req.params.room_id,
            'board_type':board_type,
        }
    });
}

// HTTP Handlers
app.get('/', function( req, res) {
    res.redirect('/' + Math.floor(Math.random() * 10000));
});
app.get('/:room_id', function(req, res){
    var board_type = agentType(req.headers['user-agent']);
    console.log(board_type);
    console.log(req.headers['user-agent']);
    if (board_type == 'browser') {
        res.render('board-browser.jade', {
            layout: false,
            locals: {
                'room_id':req.params.room_id
            }
        });
    } else {
        renderIOS(req,res);
    }
});
app.get('/:room_id/ios', function(req, res){
    renderIOS(req,res);
});
app.get('/:room_id/test', function(req, res){
    res.render('board-test.jade', {
        layout: false,
        locals: {
            'room_id':req.params.room_id
        }
    });
});

app.listen(3000);

// Socket.IO API Handlers
var io = require('socket.io');
var socket = io.listen(app, {
        'transports':['websocket', 'server-events', 'htmlfile', 'xhr-multipart', 'xhr-polling']
});
socket.on('connection', function(client){
    // Converts messages into JSON messages
    client.on('message', function (data) {
        try {
            var data_obj = JSON.parse(data);
            this.emit("jsonmessage", data_obj);
        } catch (e) {
            console.log("Couldn't parse JSON message: " + data + e);
        }
    });

    // One-time-per-client init run
    client.on('jsonmessage', function preInit(message) {
        // Wait for init and only execute once
        if (message.kind == 'init') {
            this.removeListener('jsonmessage',preInit);
            this.send(JSON.stringify({'kind':'initResponse','ready':true}));
            new Artist(client, room.getRoom(message.room_id));
        }
    });
});


process.on('uncaughtException', function(e) {
    console.log("UNCAUGHT EXCEPTION\n" + e.stack);
});

