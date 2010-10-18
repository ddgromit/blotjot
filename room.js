var sys = require('sys');
var events = require('events');

Room = function() {
    events.EventEmitter.call(this);
}
sys.inherits(Room, events.EventEmitter);

Room.prototype.addNewShapes = function(client, shapes) {
    this.emit("newShapes", client, shapes);
}
exports.Room = Room;


var rooms = {};
var getRoom = function(room_id) {
    if (!(room_id in rooms)) {
        rooms[room_id] = new Room();
    } 
    
    return rooms[room_id];
};
exports.getRoom = getRoom;