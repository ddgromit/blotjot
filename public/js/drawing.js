whiteboard = {};

whiteboard.ShapeCode = {
    QUADBEZIER:3,
    CLEAR:4
};



/* TYPES

*/
whiteboard.ShapeFromJSONObject = function(obj) {
    if (obj.type == 'bezier') {
        
    }
    if (obj[0] == whiteboard.ShapeCode.QUADBEZIER) {
        var xys = obj[3];
        var pts = [];
        for (var i = 0; i < xys.length; i = i + 2) {
            pts.push({'left':xys[i],'top':xys[i+1]});
        }
        return new whiteboard.QuadBezier(obj[1],obj[2],pts);
    } else if (obj[0] == whiteboard.ShapeCode.CLEAR) {
        return new whiteboard.Clear(obj[1]);
    }
    
    throw Error("Shape obj not recognized: " + obj[0]);
}


whiteboard.Clear = function(color) {
    this.color = color;
    this.shape_type = whiteboard.ShapeCode.CLEAR;
};
whiteboard.Clear.prototype = {
    toJSONObject:function() {
        return [
            this.shape_type,
            this.color
        ];
    }
};

whiteboard.QuadBezier = function(color, width, points) {
    this.color = color;
    this.width = width;
    this.points = points;
    this.shape_type = whiteboard.ShapeCode.QUADBEZIER;
};
whiteboard.QuadBezier.prototype = {
    'toJSONObject':function() {
        var xys = [];
        for (var i = 0; i < this.points.length; i++) {
            xys.push(parseInt(this.points[i].left));
            xys.push(parseInt(this.points[i].top));
        }
        return {
            'kind':'shape',
            'shape':whiteboard.ShapeCode.QUADBEZIER,
            'color':this.color,
            'width':this.width,
            'xys':xys
        };
    },
};

/* 
    Represents the canvas whiteboard.

    Public methods:
     - onNewShapes(shapes) - Takes the above defined shape objects, not JSON

    Public events:
     - "newLocalShapes" (shapes) - Handler with JSON representation 
    
*/
Drawing = function() {

};

Drawing.prototype = {
    ShapeCode:{
        'POINT':1,
        'LINE':2
    },
    init:function(canvas,hasTouch,board_type) {
        // Vars
        this.$canvas = canvas;
        this.context = this.getContext();
		this.board_type = board_type;
        this.drawMode = "bezier";
        this.strokeColor = '#0f0';
        this.shapeWidth=4;
        this.lastPoint = null;
		this.pointBuffer = [];
        this.hasTouch = hasTouch;
        this.lastTS = 0;
        this.shapes = [];
        this.lastSentIndex = -1;

        this.rotated = false;
		this.canvasOrig = {};
		this.curRot = 0;
		this.curTransX = 0;
		this.curTransY = 0;
		
        // Other initialization
        this.addListeners();  
        
		if (hasTouch) {
			if (window.orientation != 0) {
				self.setRotated(true,window.orientation);
			} else {
				self.setRotated(false);
			}
		}
		
		// Touch State
		this.twoFingerTouching = false;
		this.startedTouches = [];

	},

	getRotated:function() { 
	    return this.rotated; 
	},
	setRotated:function(rotate, angle, extraMargin) {
		angle = angle || 0;
		extraMargin = extraMargin || 0;
		this.$canvas.css('-webkit-transform-origin','left top');
		
		if (rotate && !this.rotated) {
			this.canvasOrig.x = this.$canvas.offset().left;
			this.canvasOrig.y = this.$canvas.offset().top;
			
			var rad;
			var transX, transY;
			if (angle == -90) {
				rad = Math.PI / 2;
				transX = 0;
				transY = -480 + extraMargin;
			} else {
				rad = -1 * Math.PI / 2;
				transX = -320;
				transY = 0 - extraMargin;
			}
			
			this.$canvas.css('-webkit-transform','rotate(' + rad + 'rad) translate(' + transX + 'px,' + transY + 'px)');
			
			this.curRot = rad;
			this.curTransX = transX;
			this.curTransY = transY;
			this.rotated = true;
		} else if (!rotate && this.rotated) {
			this.$canvas.css('-webkit-transform','');
			this.rotated = false;
			this.curRot = 0;
			this.curTransX = 0;
			this.curTransY = 0;
		}
	},
    'onRemoteShapes':function(shapes) {
        console.log('[drawing] Remote shapes: ');
        console.log(shapes);
        var drawingShapes = [];
        $.each(shapes, function(i,shape) {        
            console.log(shape);
            //drawingShapes.push(whiteboard.ShapeFromJSONObject(shape));
        });
    },
    onNewShapes:function(shapes) {
		console.log("Received " + shapes.length + " shapes.");
        for (var i = 0; i < shapes.length;i++) {
            var shape = shapes[i];
            if (shape.shape_type == whiteboard.ShapeCode.POINT) {
                this.drawPoint(shape);
            } else if (shape.shape_type == whiteboard.ShapeCode.LINE) {
                this.drawLine(shape);     
            } else if (shape.shape_type == whiteboard.ShapeCode.QUADBEZIER) {
                this.drawQuadBezier(shape);
            } else if (shape.shape_type == whiteboard.ShapeCode.CLEAR) {
                this.drawClear(shape);
            }
        }
    },
    getContext:function() {
        if (this.$canvas[0].getContext) {
            return this.$canvas[0].getContext('2d');
        } else {
            console.log('no context');
        }
    },
    getRelativePos:function(event) {
		if (this.rotated) {
			function rotate(pos, rads) {
				var res = {};
				res.x = (pos.x * Math.cos(rads)) - (pos.y * Math.sin(rads));
				res.y = (pos.x * Math.sin(rads)) + (pos.y * Math.cos(rads));
				return res;
			}
			function translate(pos, x, y) {
					var res = {};
					res.x = pos.x + x;
					res.y = pos.y + y;
					return res;
			}
			var mouse = {};
			mouse.x = event.pageX;
			mouse.y = event.pageY;
			
			var t1 = translate(mouse,-1*this.canvasOrig.x,-1*this.canvasOrig.y);
			var t2 = rotate(t1,-1*this.curRot);
			var t3 = translate(t2,-1*this.curTransX,-1*this.curTransY);
			
			return {
				'left':parseInt(t3.x),
				'top':parseInt(t3.y)
			};
			
		}
		
		// Normal
        return {
            'left':event.pageX - this.$canvas.offset().left,
            'top':event.pageY - this.$canvas.offset().top
        };
    },
    drawPoint:function(point) {
        var context = this.context;
        context.fillStyle = point.color;
        context.fillRect(point.x,point.y,point.width,point.width);
    },
    drawLine:function(line) {
        var context = this.context;
        context.beginPath();
        context.strokeStyle=line.color;
        context.lineWidth = line.width;
        context.moveTo(line.x1,line.y1);
        context.lineTo(line.x2,line.y2);
        context.stroke();
    },
    drawCurveSegment:function(color, width, p1,p2,p3) {
        var context = this.context;
        context.beginPath();
        context.strokeStyle=color;
        context.lineWidth = width;
        context.moveTo(p1.left,p1.top);
        context.quadraticCurveTo(p2.left,p2.top,p3.left,p3.top)
        context.stroke();
    
    },
    drawQuadBezier:function(quad) {
        if (quad.points.length > 0) {
            var context = this.context;
            context.beginPath();
            context.strokeStyle = quad.color;
            context.lineWidth = quad.width;

            context.moveTo(quad.points[0].left, quad.points[0].top);
            for (var i = 1; i < quad.points.length; i = i + 2) {
                if (i <= quad.points.length - 2) {
                    // If there are at least three points left
                    //this.drawCurveSegment(quad.color, quad.width, quad.points[i], quad.points[i+1], quad.points[i+2]);
                    context.quadraticCurveTo( quad.points[i].left, quad.points[i].top, quad.points[i+1].left, quad.points[i+1].top);
                } else if (i <= quad.points.length - 1) {
                    // If there are two points left
                    //var line = new whiteboard.Line(quad.color, quad.width, quad.points[i].left, quad.points[i].top, quad.points[i+1].left, quad.points[i+1].top);
                    //this.drawLine(line);
                    context.quadraticCurveTo( quad.points[i].left, quad.points[i].top, quad.points[i].left, quad.points[i].top);
                }
            }
            context.stroke();
        }
    
    },
	drawClear:function(clear) {
        var context = this.context;
        context.fillStyle = clear.color;
        context.fillRect(0,0,this.$canvas.width(),this.$canvas.height());
	},
    addListeners:function() {
        self = this;
        // Mouse listeners        
        if (!this.hasTouch) {
            var mousemove = function(e) {
                pos = self.getRelativePos(e);
                self.onPointMove(pos);
            };
            
            this.$canvas.bind("mousedown",function(e) {
                self.$canvas.bind("mousemove",mousemove);
                pos = self.getRelativePos(e);
                self.onPointStart(pos);
            });
            this.$canvas.bind("mouseup",function(e) {
                self.$canvas.unbind("mousemove");
                self.onPointEnd(null);
                
            });
            this.$canvas.bind("mouseleave",function() {
                self.$canvas.unbind("mousemove");
                self.onPointEnd(null);
            });
        } else {
            $("body").bind("orientationchange", function() {
                if (window.orientation != 0) {
                    self.setRotated(true,window.orientation);
                } else {
                    self.setRotated(false);
                }
            });
            
            // Touch listeners
            this.$canvas.bind("touchstart",function(e) {
				var touches = e.originalEvent.touches;
				
				// Detect swipes
				if (touches.length == 2 && !self.twoFingerTouching) {
					self.twoFingerTouching = true;
					self.startedTouches[touches[0].identifier] = self.getRelativePos(touches[0]);
					self.startedTouches[touches[1].identifier] = self.getRelativePos(touches[1]);
				} else if (touches.length == 1 && self.twoFingerTouching) {
					self.twoFingerTouching = false;
					self.startedTouches = [];
				}
				
				// Handle single finger moves
				if (!self.twoFingerTouching) {
					var touch = touches[0];
					var pos = self.getRelativePos(touch);
					self.onPointStart(pos);
				}
            });
            this.$canvas.bind("touchend",function(event) {
                self.onPointEnd(null);
				
				// Detect swipes
				var e = event.originalEvent;
				if (self.twoFingerTouching && (e.touches.length == 1 || e.touches.length == 0)) {
					var endTouch = e.changedTouches[0];
					var endTouchPos = self.getRelativePos(endTouch);
					if (endTouch.identifier in self.startedTouches) {
						var startTouchPos = self.startedTouches[endTouch.identifier];
						
						var dX = endTouchPos.left - startTouchPos.left;
						var dY = endTouchPos.top - startTouchPos.top;
						
						self.onSwipe(dX,dY);
					} else {
						console.log('start touch not found');
					}
					self.twoFingerTouching = false;
				}
            });
            this.$canvas.bind("touchmove",function(e) {
                
				if (!self.twoFingerTouching) {
					var touch = e.originalEvent.touches[0];
					var pos = self.getRelativePos(touch);
					self.onPointMove(pos);
				}
                
                // Block scrolling
                e.originalEvent.preventDefault();
                
            });
        }
    },
    onPointStart:function(pos) {
        this.lastPoint = pos;
        this.pointBuffer = [pos];
		
		
		// Make sure to write any inprogress beziers every once in a while
		if (this.writeBezierAnywayTimeout) {
			this.writeBezierAnywayTimeout = null;
		}
		if (this.drawMode == 'bezier') {
			if (this.writeBezierAnywayTimeout) {
				clearTimeout(this.writeBezierAnywayTimeout);
			}
			//this.setBezierTimeout();
		}
		
    },
    onPointMove:function(pos) {
        if (this.drawMode == "point") {
            var point = new whiteboard.Point(this.strokeColor, this.shapeWidth, pos.left,pos.top);
            this.drawPoint(point);
            this._addShapes([point]);
        } else if (this.drawMode == "line") {
            if (this.lastPoint != null) {
                var line = new whiteboard.Line(this.strokeColor, this.shapeWidth, this.lastPoint.left,this.lastPoint.top,pos.left,pos.top);
                this.drawLine(line);
                this._addShapes([line]);
            }
        } else if (this.drawMode == 'bezier') {
            this.pointBuffer.push(pos);

            // Draw over last few shapes of the quad
            var quad = new whiteboard.QuadBezier(this.strokeColor,this.shapeWidth, this.pointBuffer.slice(-8));
            this.drawQuadBezier(quad);

        }
        
        // Keep track of points hit
        this.lastPoint = pos;
    },
    /**
    *  Called when the mouse is let go, a single touch is lifted, or 
    *  the cursor leaves the canvas.
    */
    onPointEnd:function(pos) {
        this.lastPoint = null;
        if (this.drawMode == 'bezier' && this.pointBuffer.length > 0)
        {
            var quad = new whiteboard.QuadBezier(this.strokeColor,this.shapeWidth, this.pointBuffer);
            this.drawQuadBezier(quad);
            this._addShapes([quad]);
        }
        this.pointBuffer = [];
		
		if (this.writeBezierAnywayTimeout) {
			clearTimeout(this.writeBezierAnywayTimeout);
			this.writeBezierAnywayTimeout = null;
		}
    },
	onSwipe:function(dX,dY) {
		if (dX > 120) {
			this.clear();
		}
	},
	setBezierTimeout:function() {
		var self = this;
		var sendPartialBezier = function() {
			if (self.drawMode == 'bezier') {
				var quad = new whiteboard.QuadBezier(self.strokeColor,self.shapeWidth, self.pointBuffer);
                this._addShapes([quad]);
				self.pointBuffer = [];
				self.writeBezierAnywayTimeout = null;
				self.setBezierTimeout();
			}
		};
		this.writeBezierAnywayTimeout = setTimeout(sendPartialBezier,500);
	},
    getStrokeColor:function() {
	    return this.strokeColor;
    },
    setStrokeColor:function(hex) {
        this.strokeColor = hex;
    },
    setDrawMode:function(mode) {
        if (mode != "point" && mode != "line" && mode != "bezier") {
	    console.log("Unknown draw mode");
            return false;
        }
        this.drawMode = mode;
        return true;
    },
    setShapeWidth:function(width) {
        var w = parseInt(width);
        if (w > 0) {
            this.shapeWidth = w;   
        }
    },
    getShapeWidth:function() {
		return this.shapeWidth;
    },
	clear:function() {
		var clear = new whiteboard.Clear("#ffffff");
		this.drawClear(clear);
        this._addShapes([clear]);
	},
    '_addShapes':function(shape_objects) {
        var shape_json_objs = [];
        $.each(shape_objects, function(i, obj) {
            shape_json_objs.push(obj.toJSONObject());
        });

        // Trigger 'newLocalShapes' with just the JSON object 
        // representations of the shapes
        $(this).triggerHandler("newLocalShapes",shape_json_objs);
    }
    
};
   
$(function() {    
    var drawing = new Drawing();
    var client = new SocketClient(ROOM_ID);
    

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
    $(client).bind("clientsChanged", function(e, num_clients) {
        console.log('[socket] New client numbers: ' + message.num_clients);
        var message = "Collaborating with 0 others";
        if (num_clients == 1) {
            var message = "Collaborating with 1 other person";
        } else if (num_clients > 1) {
            var message = "Collaborating with " + num_clients + " others";
        }
        $(".clients-connected").text(message);
    });

    client.init();

    var agent=navigator.userAgent.toLowerCase();
    var is_iphone = (agent.indexOf('iphone')!=-1) || (agent.indexOf('ipad')!=-1) || (agent.indexOf('ipod')!=-1);
    var board_type = "iphone";
    drawing.init($("#whiteboard"),is_iphone, board_type);


    // Color
    var currentColor = "#222222";
    function setStrokeColor(color,ignoreColorPicker) {
        drawing.setStrokeColor(color);
        $(".stroke-color").css('background-color',color);
        currentColor = color;

        if (ignoreColorPicker || true) {
            //$("#colorpicker").ColorPickerSetColor(color);
        }
    }
    setStrokeColor(currentColor);


    $("input[name='clear']").click(function() {
        drawing.clear();
    });
    
    // Prevent selection
    $("body").bind("selectstart",function() {
        return false;
    });
});
