if (!console) {
    console = {
        'log':function() {

        }
    }
}

/*
  Handles the connection to the server and parsing the response.

  Public events:
   - "connecting" - Sending the initial request. 
   - "connected" - Handshake/init has finished, ready for shapes
   - "newRemoteShapes" (shapes)
   - "clientsChanged" (num_clients)

  Public methods:
   - onLocalShapes (shapes)
*/ 
SocketClient = function(room_id) {
    this.room_id = room_id;
    var self = this;
    // Socket without flash
    
	this.socket = new io.Socket(location.hostname, {
        'transports':['websocket', 'server-events', 'htmlfile', 'xhr-multipart', 'xhr-polling']
    });
	
	// Init the room on connect
	this.socket.on('connect', function() {
	    self._send({
	       'kind':'init',
	       'room_id':self.room_id
	    });
	});
	
	// Parse JSON messages
    this.socket.on("message", function(data_str) {
        try {
            var parsed = $.parseJSON(data_str);
        } catch (e) {
            console.log("Couldn't JSON parse message: " + data_str);
            return;
        }
        self._onMessage(parsed);
    });
    
};
SocketClient.prototype = {
    'init':function() {
        $(this).triggerHandler("connecting");
	    this.socket.connect();
    },
    /* Passed the incoming data as a JSON object */
    '_onMessage':function(message) {
        // Validate
        if (!('kind' in message)) {
            console.log('Received message without a kind: ' + message);
            return;
        }
        
        if (message.kind == 'shapes') {
            // Validate
            if (!('shapes' in message)) {
                console.log("Shapes message doesn't have shapes attr: " + message);
                return;
            }
                
            $(this).triggerHandler("newRemoteShapes", [message.shapes]);
        }
        
        if (message.kind == 'initResponse') {
            if (message.ready) {
        	    $(this).triggerHandler('connected');
            }
        }
        if (message.kind == 'clientsChanged') {
            console.log('New client numbers: ' + message.num_clients);
            $(this).triggerHandler("clientsChanged", message.num_clients);
        }
    },
    'onLocalShapes':function(shapes) {
        this._send({
            'kind':'shapes',
            'shapes':shapes
        });
    },
    '_send':function(obj) {
        this.socket.send(JSON.stringify(obj));
    }
};

