var sys = require('sys');
var http = require('http');
var events = require('events');
var express = require('express');
var connect = require('connect');

var Artist = require('./artist').Artist;
var Room = require('./room').Room;

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

var oneRoom = new Room();
var getRoom = function() {
    return oneRoom;
};

var io = require('socket.io'); 
var socket = io.listen(app); 
socket.on('connection', function(client){ 
    console.log('connected');
    var a = new Artist(client, getRoom());
    
    client.on('message', function(data) {
        console.log('message: ' + data);
    }); 
    client.on('disconnect', function() {
        console.log('disconnect');
    });
});


