var sys = require('sys');
var events = require('events');
var _ = require('underscore')._;
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
    this.clients = {};
    events.EventEmitter.call(this);
    this.on('clientsChanged', function(num) {
        console.log('changed some clients: ' + num);
    });
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
};
Room.prototype.numClients = function() {
    return _.keys(this.clients).length;
};
Room.prototype.addClient = function(client) {
    var id = client.sessionId;
    if (!(id in this.clients)) {    
        this.clients[id] = {};
        this.emit("clientsChanged", this.numClients());   
        //console.log(sys.inspect(client));
    }
    
    var self = this;
    client.on('disconnect', function() {
        delete self.clients[id];
        self.emit("clientsChanged", self.numClients());
    });
}

exports.Room = Room;



// A room manager
var rooms = {};
var getRoom = function(room_id) {
    if (!(room_id in rooms)) {
        rooms[room_id] = new Room(room_id);
        console.log('Made a new room : ' + room_id);
    } 
    
    return rooms[room_id];
};
exports.getRoom = getRoom;
