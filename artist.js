Artist = function(client, room) {
    var self = this;
    this.client = client;
    this.room = room;
    
    this.room.on("newShapes", self._newRemoteShapes.bind(this));
    this.client.on('connect', self._connect.bind(this));
    this.client.on('message', self._data.bind(this));
};
Artist.prototype = {
    '_connect':function() {
        
    },
    '_data': function(data_str) {
        try {
            var data = JSON.parse(data_str);
        } catch (e) {
            console.log("Couldn't parse JSON: " + data_str);
            return;
        }
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
        this.room.addNewShapes(this.client, shapes);
    },
    '_newRemoteShapes':function(client, shapes) {
        this.client.send(JSON.stringify({
            'kind':'shapes',
            'shapes':shapes
        }));
    }
    
};
exports.Artist = Artist;