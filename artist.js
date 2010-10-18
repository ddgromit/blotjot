Artist = function(client, room) {
    this.client = client;
    this.room = room;
    
    this.room.on("newShapes", this._newRemoteShapes.bind(this));
    this.client.on('jsonmessage', this._data.bind(this));
    this._connect();
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
    '_sendJSON':function(obj) {
        this.client.send(JSON.stringify(obj));
        return this;
    }
    
};
exports.Artist = Artist;
