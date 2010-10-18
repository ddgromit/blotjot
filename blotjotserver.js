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
    client.on('message', function preInit(data) {
        // Parse message
        console.log('message: ' + data);
        message = JSON.parse(data);
        
        // Wait for init and only execute once
        if (message.kind == 'init') {
            new Artist(client, room.getRoom(message.room_id));
            this.removeListener('message',preInit);
            this.send(JSON.stringify({'kind':'initResponse','ready':true}));
        }
    }); 
});


