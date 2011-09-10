var sys = require('sys');
var http = require('http');
var events = require('events');
var express = require('express');
var connect = require('connect');

var Artist = require('./artist').Artist;
var room = require('./room');

var app = express.createServer();
app.use(express.static(__dirname + '/public'));

function agentType(agent) {
    var agent = agent.toLowerCase();
    if (agent.indexOf("ipod") >= 0) return "ipod";
    if (agent.indexOf("iphone") >= 0) return "iphone";
    if (agent.indexOf("ipad") >= 0) return "ipad";
    return "browser";
}
function renderIOS(req,res, board_type) {
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
    res.render('homepage.jade', {
        layout:false,
        locals: {

        }
    })
    //res.redirect('/' + Math.floor(Math.random() * 10000));
});
app.get('/create', function( req, res) {
    // Validate params
    var type = req.param('type') ? req.param('type').toLowerCase() : null;
    var room_id = req.param('room_id') ? req.param('room_id').toLowerCase() : null;

    if (type != 'iphone' && type != 'ipad') {
        throw Error("Type must be iphone or ipad");
    }
    if (!room_id || room_id.search(/^[a-zA-Z0-9]+$/) < 0) {
        throw Error("Room ID must be only letters and numbers");
    }

    // Try to create the room
    room.createRoom(room_id,type, function(success) {
        if (success) {
            res.redirect('/' + room_id);
        } else {
            throw Error("Room already exists");
        }
    });

});
app.get('/:room_id', function(req, res){
    room.getRoom(req.params.room_id, function(room) {
        if (room) {
            var ua_type = agentType(req.headers['user-agent']);
            console.log(ua_type);
            if (ua_type == 'browser') {
                res.render('board-browser.jade', {
                    layout: false,
                    locals: {
                        'room_id':req.params.room_id,
                        'board_type':room.type
                    }
                });
            } else {
                renderIOS(req,res, room.type);
            }
        } else {
            res.send("Room not found",404);
        }
    });
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
var sio = require('socket.io');
var io = sio.listen(app, {
        'transports':['websocket', 'server-events', 'htmlfile', 'xhr-multipart', 'xhr-polling']
});
io.sockets.on('connection', function(client){
    // Converts messages into JSON messages
    client.on('message', function (data) {
        try {
            var message = JSON.parse(data);
        } catch (e) {
            console.log("Couldn't parse JSON message: " + data + e);
            return;
        }

        // Wait for init and only execute once
        if (message.kind == 'init') {
            room.getRoom(message['room_id'], function(room) {
                if (room) {
                    client.emit("message",JSON.stringify({'kind':'initResponse','ready':true}));
                    new Artist(client, room);
                } else {
                    throw Error("Room not found");
                }
            });
        }
    });
});


process.on('uncaughtException', function(e) {
    console.log("UNCAUGHT EXCEPTION\n" + e.stack);
});

