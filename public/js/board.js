if (!console) {
    console = {
        'log':function() {

        }
    }
}

$(function(){    
    var client = new SocketClient();
    var drawing = new Drawing();
    
    // Send new received shapes to drawing
    $(client).bind("newRemoteShapes", function(e, shapes) { 
        console.log("New remote shapes:");
        console.log(shapes);
        drawing.onRemoteShapes(shapes);
    });
    $(drawing).bind("newLocalShapes", function(e, shapes) {
        console.log("New local shapes: ");
        console.log(shapes);
        client.onLocalShapes(shapes);
    });
    
    // Test receiving shapes
    var message1 = {
        'kind':'shapes',
        'shapes':[
        {
            'type':'bezier',
            'points':[[1,2],[3,4]]
        },    
        {
            'type':'bezier',
            'points':[[4,5],[2,1]]
        }]
    };
    client.onMessage(message1);
    
    // Test drawing shapes
    $(client).bind('connected', function() {
        var shapesDrawn = [
            {
                'type':'bezier',
                'points':[[33,31],[40,42]]
            },    
            {
                'type':'bezier',
                'points':[[50,51],[52,53]]
            }
        ];
        drawing.onDraw(shapesDrawn);
    });
});

SocketClient = function() {
    var self = this;
	this.socket = new io.Socket('localhost');
	
	// Init the room on connect
	this.socket.on('connect', function() {
	    self.send({
	       'kind':'init',
	       'room_id':1 
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
        self.onMessage(parsed);
    });
    
	this.socket.connect();
};
SocketClient.prototype = {
    /* Passed the incoming data as a JSON object */
    'onMessage':function(message) {
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
    },
    'onLocalShapes':function(shapes) {
        this.send({
            'kind':'shapes',
            'shapes':shapes
        });
    },
    'send':function(obj) {
        this.socket.send(JSON.stringify(obj));
    }
};

Drawing = function() {
    
}
Drawing.prototype = {
    'onRemoteShapes':function(shapes) {
        
    },
    'onDraw':function(shapes) {
        $(this).triggerHandler("newLocalShapes", [shapes]);
    }
}