Artist = function(client, room) {
    var self = this;
    this.client = client;
    this.room = room;
    
    this.room.on("newShapes", self._newRemoteShapes.bind(this));
    this.client.on('connect', self._connect.bind(this));
    this.client.on('jsonmessage', self._data.bind(this));
};
Artist.prototype = {
    '_connect':function() {
        
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
        this.send(JSON.stringify(obj));
        return this;
    }
    
};
exports.Artist = Artist;
