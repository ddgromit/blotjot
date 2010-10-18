/* 
  Hooks for the drawing surface.

  Public events: 
   - "newLocalShapes" (shapes)

  Public methods: 
   - onRemoteShapes (shapes)
*/
Drawing = function() {
    
}
Drawing.prototype = {
    'onRemoteShapes':function(shapes) {
        
    },
    '_onDraw':function(shapes) {
        $(this).triggerHandler("newLocalShapes", [shapes]);
    }
}



/* Function for the page */
$(function(){    
    
    var client = new SocketClient(ROOM_ID);
    var drawing = new Drawing();
    
    // Send new received shapes to drawing
    $(client).bind("newRemoteShapes", function(e, shapes) { 
        console.log("[socket] New remote shapes:");
        console.log(shapes);
        drawing.onRemoteShapes(shapes);
    });
    $(drawing).bind("newLocalShapes", function(e, shapes) {
        console.log("[drawing] New local shapes: ");
        console.log(shapes);
        client.onLocalShapes(shapes);
    });
    
    // Hooks into the events:
    $(client).bind("connecting", function(e) {
        console.log('[socket] Connecting...');
    });
    $(client).bind("connected", function(e) {
        console.log('[socket] Connected.');
    });

    client.init();

    // Test receiving shapes
    window.testReceiveShapes = function() {
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
        client._onMessage(message1);
    }
    
    // Test drawing shapes
    $(client).bind('connected', function() {
        window.testSendShapes = function() {
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
            drawing._onDraw(shapesDrawn);
        }
    });

});
