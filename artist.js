var _ = require('underscore')._;
var sys = require('sys');

Artist = function(client, room) {
    this.client = client;
    this.room = room;
    
    this.room.on("newShapes", this._newRemoteShapes.bind(this));
    this.client.on('jsonmessage', this._data.bind(this));
    this._connect();

    this.room.addClient(this.client);
    this.room.on("clientsChanged", this._clientsChanged.bind(this));
};
Artist.prototype = {
    '_connect':function() {
        // Get and send shapes already on the board
        var self = this;
        this.room.getAllShapes(function(docs) {
            var shapes = [];
            docs.forEach(function(doc) {
                doc.shapes.forEach(function(shape) {
                    shapes.push(shape);
                });
            });
            self._newRemoteShapes(null, shapes);
        });
        this._sendClients();
    },
    '_data': function(data) {
        if (!('kind' in data)) {
            console.log('Received data without kind: ' + data_str);
            return;
        }
        if (data.kind == 'shapes') {
            if (!('shapes' in data)) {
                console.log('Received shapes data without shapes key: ' + data_str);
                return;
            }
            this._newLocalShapes(data.shapes);
        }
    },
    '_newLocalShapes':function(shapes) {
        if (!validateShapes(shapes)) {
            console.log('Invalid shapes: ' + sys.inspect(shapes));
        }
        console.log('Received ' + shapes.length + ' local shapes.');
        this.room.addNewShapes(this.client, shapes);
    },
    '_newRemoteShapes':function(client, shapes) {
        if (client != this.client) {
            this._sendJSON({
                'kind':'shapes',
                'shapes':shapes
            });
        }
    },
    '_sendClients':function(num_clients) {
        this._sendJSON({
            'kind':'clientsChanged',
            'num_clients':this.room.numClients()
        });
    },
    '_clientsChanged':function(num_clients) {
        this._sendJSON({
            'kind':'clientsChanged',
            'num_clients':num_clients
        });
    },
    '_sendJSON':function(obj) {
        this.client.send(JSON.stringify(obj));
        return this;
    }
    
};

function validateShapes(shapes) {
    try {
        shapes.forEach(function(shape) {
            if (!('type' in shape)) {
                throw Exception();
            }
            if (shape.type == 'bezier') {
                if (!('color' in shape)) {
                    throw Exception();
                }
                if (!('width' in shape)) {
                    throw Exception();
                }
                if (!('pts' in shape)) {
                    throw Exception();
                }
                shape.pts.forEach(function(dim) {
                    if (!(typeof(dim) == "number")) {
                        throw Exception();
                    }
                });
                return;
            } else if (shape.type == 'clear') {
                if (!('color' in shape)) {
                    throw Exception();
                }
                return;
            }
        });
        return true;
    } catch (e) {
        return false;
    }
}
exports.Artist = Artist;
