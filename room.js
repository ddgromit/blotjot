var sys = require('sys');
var events = require('events');
var mongodb = require("mongodb"),
    Db = mongodb.Db,
    Server = mongodb.Server;


// Initialize the DB
var DB_NAME = 'blotjot-node';
var SHAPES_COLL_NAME = 'shapes';
var dbclient = new Db(DB_NAME, new Server("127.0.0.1", 27017, {}));
dbclient.open(function() {});


// A room
Room = function(room_id) {
    this.room_id = room_id;
    events.EventEmitter.call(this);
}
sys.inherits(Room, events.EventEmitter);

Room.prototype.addNewShapes = function(client, shapes) {
    this.emit("newShapes", client, shapes);
    this.storeShapes(shapes);
}
Room.prototype.storeShapes = function(shapes) {
    doc = {
        'room_id':this.room_id,
        'shapes': shapes
    };
    
    dbclient.collection(SHAPES_COLL_NAME, function(err, collection) {
        collection.insert(doc, function(err, docs) {
            if (err) {
                console.log("DB insert error: " + err + " for doc " + sys.inspect(doc));
                return;
            }
        });
    });
}
Room.prototype.getAllShapes = function(callback) {
    var self = this;
    dbclient.collection(SHAPES_COLL_NAME, function(err, collection) {
        if (err) {
            console.log('Error getting collection');
            return;
        }
        collection.find({'room_id':self.room_id},{'sort':'_id'},function(err,cursor) {
            if (err) {
                console.log('Error with find');
                return;
            }
            cursor.toArray(function(err, docs) {
                if (err) {
                    console.log('Error with toArray');
                    return;
                }
                callback(docs);
            });
        });
    });
}
exports.Room = Room;



// A room manager
var rooms = {};
var getRoom = function(room_id) {
    if (!(room_id in rooms)) {
        rooms[room_id] = new Room(room_id);
    } 
    
    return rooms[room_id];
};
exports.getRoom = getRoom;
