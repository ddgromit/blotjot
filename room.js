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