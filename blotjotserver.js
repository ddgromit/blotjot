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
app.get('/', function(req, res){ 
    res.render('board.jade', {
        layout: false,
        locals: {
            
        }
    });
}); 
app.listen(3000);


var io = require('socket.io');
var socket = io.listen(app); 
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
            new Artist(client, room.getRoom(message.room_id));
            this.removeListener('jsonmessage',preInit);
            this.send(JSON.stringify({'kind':'initResponse','ready':true}));
        }
    }); 
});


