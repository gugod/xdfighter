/*
 * gameQuery rev. 0.4
 *
 * Copyright (c) 2008 Selim Arsever (gamequery.onaluf.org)
 * licensed under the MIT (MIT-LICENSE.txt)
 */
// this allow to used the convenient $ notation in  a plugins 
(function($) {
    
    $.extend({ gameQuery: {
        /**
         * This is the Animation Object
         */
        Animation: function (options) {
            // private default values
            var defaults = {
                imageURL:		"",
                numberOfFrame:	1,
                delta:			0,
                rate: 			30,
                type:			0,
                distance:		0
            };
            
            // options extends defaults
            options = $.extend(defaults, options);

            //"public" attributes:
            this.imageURL		= options.imageURL;		// The url of the image to be used as an animation or sprite 
            this.numberOfFrame	= options.numberOfFrame;// The number of frame to be displayed when playing the animation
            this.delta			= options.delta;		// The the distance in pixels between two frame
            this.rate			= options.rate;			// The rate at which the frame must be played in miliseconds
            this.type			= options.type;			// The type of the animation.This is bitwise OR of the properties.
            this.distance		= options.distance;		// The the distance in pixels between two animation
            
            //Whenever a new animation is created we add it to the ResourceManager animation list
            $.gameQuery.resourceManager.addAnimation(this);
            
            return true;
        },
        
        // "constants" for the different type of an animation
        ANIMATION_VERTICAL:   1,  // genertated by a verical offset of the background
        ANIMATION_HORIZONTAL: 2,  // genertated by a horizontal offset of the background
        ANIMATION_ONCE:       4,  // played only once (else looping indefinitly)
        ANIMATION_CALLBACK:   8,  // A callack is exectued at the end of a cycle 
        ANIMATION_MULTI:      16, // The image file contains many animations
        
        // "constants" for the different type of geometry for a sprite
        GEOMETRY_RECTANGLE:   1,
        GEOMETRY_DISC:        2, 
        
        // basic values
		refreshRate: 		  30,
        
        /**
         * An object to manages the resources loading
         **/
		resourceManager: {
            animations: [],    // List of animation / images used in the game
            sounds:     [],    // List of sounds used in the game
            callbacks:  [],    // List of the functions called at each refresh
            running:    false, // State of the game,
            
            /**
             * This function the covers things to load befor to start the game.
             **/
            preload: function() {
                //Start loading the images
                for (var i = this.animations.length-1 ; i >= 0; i --){
                    this.animations[i].domO = new Image();
                    this.animations[i].domO.src = this.animations[i].imageURL;
                }
                
                //Start loading the sounds
                for (var i = this.sounds.length-1 ; i >= 0; i --){
                    this.sounds[i].load();
                }
                 
                $.gameQuery.resourceManager.waitForResources();
            },
            
            /**
             * This function the waits for all the resources called for in preload() to finish loading.
             **/
            waitForResources: function() {
                var loadbarEnabled = ($.gameQuery.loadbar != undefined);
                if(loadbarEnabled){
                    $($.gameQuery.loadbar.id).width(0); 
                    var loadBarIncremant = $.gameQuery.loadbar.width / (this.animations.length + this.sounds.length);
                }
                //check the images
                var imageCount = 0; 
                for(var i=0; i < this.animations.length; i++){
                    if(this.animations[i].domO.complete){
                        imageCount++;
                    }
                }
                //check the sounds 
                var soundCount = 0; 
                for(var i=0; i < this.sounds.length; i++){
                    var temp = this.sounds[i].ready();
                    if(temp){
                        soundCount++;
                    }
                }
                //update the loading bar
                if(loadbarEnabled){
                    $("#"+$.gameQuery.loadbar.id).width((imageCount+soundCount)*loadBarIncremant); 
                    if($.gameQuery.loadbar.callback){
                        $.gameQuery.loadbar.callback((imageCount+soundCount)/(this.animations.length + this.sounds.length)*100);
                    }
                }
                
                if(imageCount + soundCount < (this.animations.length + this.sounds.length)){
                    imgWait=setTimeout("jQuery.gameQuery.resourceManager.waitForResources()", 100);
                } else {
                    // all the resources are loaded!
                    // We can associate the animation's images to their coresponding sprites
                    $.gameQuery.sceengraph.children().each(function(){
                        // recursive call on the children:
                        $(this).children().each(arguments.callee);
                        // add the image as a background
                        if(this.gameQuery && this.gameQuery.animation){
                            $(this).css("background-image", "url("+this.gameQuery.animation.imageURL+")");
                            // we set the correct kind of repeat
                            if(this.gameQuery.animation.type & $.gameQuery.ANIMATION_VERTICAL) {
                                $(this).css("background-repeat", "repeat-x");
                            } else if(this.gameQuery.animation.type & $.gameQuery.ANIMATION_HORIZONTAL) {
                                $(this).css("background-repeat", "repeat-y");
                            } else {
                                $(this).css("background-repeat", "no-repeat");
                            }
                        }
                    });
                    
                    // And launch the refresh loop
                    $.gameQuery.resourceManager.running = true;
                    setInterval("jQuery.gameQuery.resourceManager.refresh()",($.gameQuery.refreshRate));
                    if($.gameQuery.startCallback){
                        $.gameQuery.startCallback();
                    }
                    //make the sceengraph visible
                    $.gameQuery.sceengraph.css("visibility","visible");
                }
            },
            
            /**
             * This function refresh a unique sprite here 'this' represent a dom object
             **/
            refreshSprite: function() {
                //Call this function on all the children:
                $(this).children().each(arguments.callee);
                // is 'this' a sprite ? 
                if(this.gameQuery != undefined){
                    var gameQuery = this.gameQuery;
                    // does 'this' has an animation ?
                    if(gameQuery.animation){
                        //Do we have anything to do?
                        if(gameQuery.idleCounter == gameQuery.animation.rate-1){
                            // does 'this' loops?
                            if(gameQuery.animation.type & $.gameQuery.ANIMATION_ONCE){
                                if(gameQuery.currentFrame < gameQuery.animation.numberOfFrame-2){
                                    gameQuery.currentFrame++;
                                } else if(gameQuery.currentFrame == gameQuery.animation.numberOfFrame-2) {
                                    gameQuery.currentFrame++;
                                    // does 'this' has a callback ?
                                    if(gameQuery.animation.type & $.gameQuery.ANIMATION_CALLBACK){
                                        if($.isFunction(gameQuery.callback)){
                                            gameQuery.callback(this);
                                        }
                                    }
                                }
                            } else {
                                gameQuery.currentFrame = (gameQuery.currentFrame+1)%gameQuery.animation.numberOfFrame;
                                if(gameQuery.currentFrame == 0){
                                    // does 'this' has a callback ?
                                    if(gameQuery.animation.type & $.gameQuery.ANIMATION_CALLBACK){
                                        if($.isFunction(gameQuery.callback)){
                                            gameQuery.callback(this);
                                        }
                                    }
                                }
                            }
                            // update the background:
                            if(gameQuery.animation.type & $.gameQuery.ANIMATION_VERTICAL){
                                if(gameQuery.multi){
                                    $(this).css("background-position",""+gameQuery.multi+"px "+(-gameQuery.animation.delta*gameQuery.currentFrame)+"px");
                                } else {
                                    $(this).css("background-position","0px "+(-gameQuery.animation.delta*gameQuery.currentFrame)+"px");
                                }
                            } else if(gameQuery.animation.type & $.gameQuery.ANIMATION_HORIZONTAL) {
                                if(gameQuery.multi){
                                    $(this).css("background-position",""+(-gameQuery.animation.delta*gameQuery.currentFrame)+"px "+gameQuery.multi+"px");
                                } else {
                                    $(this).css("background-position",""+(-gameQuery.animation.delta*gameQuery.currentFrame)+"px 0px");
                                }
                            }
                        }
                        gameQuery.idleCounter = (gameQuery.idleCounter+1)%gameQuery.animation.rate;
                    }
                }
                return true;
            },
            
            /**
             * This function is called periodically to refresh the state of the game.
             **/
            refresh: function() {
                $.gameQuery.sceengraph.children().each(this.refreshSprite);
                
                var deadCallback= new Array();
                for (var i = this.callbacks.length-1; i >= 0; i--){
                    if(this.callbacks[i].idleCounter == this.callbacks[i].rate-1){
                        var returnedValue = this.callbacks[i].fn();
                        if(typeof returnedValue == 'boolean'){
                            // if we have a boolean: 'true' means 'no more execution', 'false' means 'execute once more'
                            if(returnedValue){
                                deadCallback.push(i);
                            }
                        } else if(typeof returnedValue == 'number') {
                            // if we have a number it re-defines the time to the nex call
                            this.callbacks[i].rate = Math.round(returnedValue/$.gameQuery.refreshRate);
                            this.callbacks[i].idleCounter = 0;
                        }
                    }
                    this.callbacks[i].idleCounter = (this.callbacks[i].idleCounter+1)%this.callbacks[i].rate;
                }
                for(var i = deadCallback.length-1; i >= 0; i--){
                    this.callbacks.splice(deadCallback[i],1);
                }
            },
            
            addAnimation: function(animation) {
                if($.inArray(animation,this.animations)<0){
                    //normalize the animationRate:
                    animation.rate = Math.round(animation.rate/$.gameQuery.refreshRate);
                    if(animation.rate==0){
                        animation.rate = 1;
                    }
                    this.animations.push(animation);
                }
            },
            
            addSound: function(sound){
                if($.inArray(sound,this.sounds)<0){
                    this.sounds.push(sound);
                }
            },

            
            registerCallback: function(fn, rate){
                rate  = Math.round(rate/$.gameQuery.refreshRate);
                if(rate==0){
                    rate = 1;
                }
                this.callbacks.push({fn: fn, rate: rate, idleCounter: 0});
            }
        },
        
        // This is a utility function that returns the radius for a geometry
        proj: function (elem, angle) {
            switch (elem.geometry){
                case $.gameQuery.GEOMETRY_RECTANGLE :
                    var b = angle*Math.PI*2/360;
                    var Rx = Math.abs(Math.cos(b)*elem.rx)+Math.abs(Math.sin(b)*elem.ry);
                    var Ry = Math.abs(Math.cos(b)*elem.ry)+Math.abs(Math.sin(b)*elem.rx);
                    
                    return {x: Rx, y: Ry};
            }
        },
        
        // This is a utility function for collision of two object 
        collide: function(elem1, elem2) {
            // Test bounding boxes
            if(!((elem2.bottom < elem1.top)||(elem2.right < elem1.left)||
                (elem2.top > elem1.bottom)||(elem2.left > elem1.right))) {
                if((elem1.geometry == $.gameQuery.GEOMETRY_RECTANGLE && elem2.geometry == $.gameQuery.GEOMETRY_RECTANGLE) && (elem1.angle == 0 && elem2.angle == 0)){
                    return true; // Without rotation bounding box is enough for rectangle!
                } else {
                    var center1 = {x: (elem1.right + elem1.left) / 2, y: (elem1.top + elem1.bottom) / 2};
                    var center2 = {x: (elem2.right + elem2.left) / 2, y: (elem2.top + elem2.bottom) / 2};
                    
                    var dx = center2.x - center1.x;
                    var dy = center2.y - center1.y;
                    var a  = Math.atan(dy/dx);

                    var Dx = Math.abs(Math.cos(a-elem1.angle*Math.PI*2/360)/Math.cos(a)*dx);
                    var Dy = Math.abs(Math.sin(a-elem1.angle*Math.PI*2/360)/Math.sin(a)*dy);
                    var R = $.gameQuery.proj(elem2, elem2.angle-elem1.angle);
                    
                    if((elem1.rx+R.x < Dx) || (elem1.ry+R.y < Dy)) {
                        return false;
                    } else {                  
                        /*here the other way round*/
                        var Dx = Math.abs(Math.cos(a-elem2.angle*Math.PI*2/360)/Math.cos(a)*-dx);
                        var Dy = Math.abs(Math.sin(a-elem2.angle*Math.PI*2/360)/Math.sin(a)*-dy);
                        var R = $.gameQuery.proj(elem1, elem1.angle-elem2.angle);
                        if((elem2.rx+R.x < Dx) || (elem2.ry+R.y < Dy)) {
                            return false;
                        } else {  
                            return true;
                        }
                    }
                }
            } else {
                return false;
            }
        }
    }, muteSound: function(muted){
        for (var i = $.gameQuery.resourceManager.sounds-1 ; i >= 0; i --) {
            $.gameQuery.resourceManager.sounds[i].muted(muted);
        }
    }, playground: function() { return $.gameQuery.playground}});
    
    $.fn.extend({	
        /**
         * Define the div to use for the display the game and initailize it.
         * This could be called on any node it doesn't matter.
         * The returned node is the playground node.
         * This IS a desrtuctive call
         **/
        playground: function(options) {
            if(this.length == 1){
                if(this[0] == document){ // Old usage check
                    throw "Old playground usage, use $.playground() to retreive the playground and $('mydiv').playground(options) to set the div!";
                }
                options = $.extend({
                    height:		320,
                    width:		480,
                    refreshRate: 30,
                    position:	"absolute",
                    keyTracker:	false,
                    disableCollision: false
                }, options);
                //We save the playground node and set some variable for this node:
                $.gameQuery.playground = this;
                $.gameQuery.refreshRate = options.refreshRate;
                $.gameQuery.playground[0].height = options.height;
                $.gameQuery.playground[0].width = options.width;

                // We initialize the apearance of the div
                $.gameQuery.playground.css({
                        position: options.position,
                        display:  "block",
                        overflow: "hidden",
                        height:   options.height+"px",
                        width:    options.width+"px"
                    })
                    .append("<div id='sceengraph' style='visibility: hidden'/>");
                    
                $.gameQuery.sceengraph = $("#sceengraph");
                
                //Add the keyTracker to the gameQuery object:
                $.gameQuery.keyTracker = {};
                // we only enable the real tracking if the users wants it
                if(options.keyTracker){
                    $(document).keydown(function(event){
                        $.gameQuery.keyTracker[event.keyCode] = true;
                    });
                    $(document).keyup(function(event){
                        $.gameQuery.keyTracker[event.keyCode] = false;
                    });
                }
            }
            return this;
        },
        
        /**
        * Starts the game. The resources from the resource manager are preloaded if necesary 
        * Works only for the playgroung node.
        * This is a non-desrtuctive call
        **/
        startGame: function(callback) {
            //if the element is the playground we start the game:
            $.gameQuery.startCallback = callback;
            $.gameQuery.resourceManager.preload();
            return this;
        },
        
        /**
        * Add a group to the sceen graph
        * works only on the sceengraph root or on another group
        * This IS a desrtuctive call and should be terminated with end() to go back one level up in the chaining
        **/
        addGroup: function(group, options) {
            options = $.extend({
                width:		32,
                height:		32,
                posx:		0,
                posy:		0,
                overflow: 	"visible"
            }, options);
            
            var newGroupElement = "<div id='"+group+"' class='group' style='position: absolute; display: block; overflow: "+options.overflow+"; top: "+options.posy+"px; left: "+options.posx+"px; height: "+options.height+"px; width: "+options.width+"px;' />";
            if(this == $.gameQuery.playground){
                $.gameQuery.sceengraph.append(newGroupElement);
            } else if ((this == $.gameQuery.sceengraph)||(this.hasClass("group"))){
                this.append(newGroupElement);
            }
            var newGroup = $("#"+group);
            newGroup[0].gameQuery = options;
            newGroup[0].gameQuery.group = true;
            return this.pushStack(newGroup);
        },
        
        /**
        * Add a sprite to the current node.
        * Works only on the playground, the sceengraph root or a sceengraph group
        * This is a non-desrtuctive call
        **/
        addSprite: function(sprite, options) {
            options = $.extend({
                width:			32,
                height:			32,
                posx:			0,
                posy:			0,
                idleCounter:	0,
                currentFrame:	0,
                geometry:       $.gameQuery.GEOMETRY_RECTANGLE
            }, options);
            
            var newSpriteElem = "<div id='"+sprite+"' style='position: absolute; display: block; overflow: hidden; height: "+options.height+"px; width: "+options.width+"px; left: "+options.posx+"px; top: "+options.posy+"px; background-position: 0px 0px;' />";
            if(this == $.gameQuery.playground){
                $.gameQuery.sceengraph.append(newSpriteElem);
            } else {
                this.append(newSpriteElem);
            }
            
            //if the game has already started we want to add the animation's image as a background now:
            if(options.animation){
                if($.gameQuery.resourceManager.running){
                    $("#"+sprite).css("background-image", "url("+options.animation.imageURL+")");
                }
                if(options.animation.type & $.gameQuery.ANIMATION_VERTICAL) {
                    $("#"+sprite).css("background-repeat", "repeat-x");
                } else if(options.animation.type & $.gameQuery.ANIMATION_HORIZONTAL) {
                    $("#"+sprite).css("background-repeat", "repeat-y");
                } else {
                    $("#"+sprite).css("background-repeat", "no-repeat");
                }
            }
            
            
            var spriteDOMObject = $("#"+sprite)[0];
            if(spriteDOMObject != undefined){
                spriteDOMObject.gameQuery = options;
            }
            return this;
        },
        
        /**
        * Remove the sprite  on which it is called. This is here for backward compatibility  but it doesn't
        * do anything more than simply calling .remove()
        * This is a non-desrtuctive call
        **/
        removeSprite: function() {
            this.remove();
            return this;
        },
        
        /**
        * Changes the animation associated with a sprite.
        * WARNING: no check are made to ensure that the object is really a sprite
        * This is a non-desrtuctive call
        **/
        setAnimation: function(animation, callback) {
            var gameQuery = this[0].gameQuery;
            if(typeof animation == "number"){
                if(gameQuery.animation.type & $.gameQuery.ANIMATION_MULTI){
                    var distance = gameQuery.animation.distance * animation;
                    gameQuery.multi = distance;
                    if(gameQuery.animation.type & $.gameQuery.ANIMATION_VERTICAL) {
                       gameQuery.currentFrame = 0;
                        this.css("background-position",""+distance+"px 0px");
                    } else if(gameQuery.animation.type & $.gameQuery.ANIMATION_HORIZONTAL) {
                        gameQuery.currentFrame = 0;
                        this.css("background-position","0px "+distance+"px");
                    }
                }
            } else {
                if(animation){
                    gameQuery.animation = animation;
                    gameQuery.currentFrame = 0;
                    this.css({"background-image": "url("+animation.imageURL+")", "background-position": "0px 0px"});
                    
                    if(gameQuery.animation.type & $.gameQuery.ANIMATION_VERTICAL) {
                        this.css("background-repeat", "repeat-x");
                    } else if(gameQuery.animation.type & $.gameQuery.ANIMATION_HORIZONTAL) {
                        this.css("background-repeat", "repeat-y");
                    } else {
                        this.css("background-repeat", "no-repeat");
                    }
                } else {
                    this.css("background-image", "");
                }
            }
            
            if(callback != undefined){
                this[0].gameQuery.callback = callback;	
            }
            
            return this;
        },
        
        /**
        * This function add the sound to the resourceManger for later use and associate it to the selected dom element(s).
        * This is a non-desrtuctive call
        **/
        addSound: function(sound, add) {
            // Does a SoundWrapper exists
            if($.gameQuery.SoundWrapper) {
                var gameQuery = this[0].gameQuery;
                // should we add to existing sounds ?
                if(add) {
                    // we do, have we some sound associated with 'this'?
                    var sounds = gameQuery.sounds;
                    if(sounds) {
                        // yes, we add it
                        sounds.push(sound);
                    } else {
                        // no, we create a new sound array
                        gameQuery.sounds = [sound];
                    }
                } else {
                    // no, we replace all sounds with this one
                    gameQuery.sounds = [sound];
                }
            }
            return this;
        },
        
        /**
        * This function plays the sound(s) associated with the selected dom element(s)
        * This is a non-desrtuctive call
        **/
        playSound: function() {
            $(this).each(function(){
                var gameQuery = this.gameQuery;
                if(gameQuery.sounds) {
                    for(var i = gameQuery.sounds.length-1 ; i >= 0; i --) {
                        gameQuery.sounds[i].play();
                    }
                }
            });
            
            return this;
        },
        
        /**
        * This function stops the sound(s) associated with the selected dom element(s) and rewind them
        * This is a non-desrtuctive call
        **/
        stopSound: function() {
            $(this).each(function(){
                var gameQuery = this.gameQuery;
                if(gameQuery.sounds) {
                    for(var i = gameQuery.sounds.length-1 ; i >= 0; i --) {
                        gameQuery.sounds[i].stop();
                    }
                }
            });
            return this;
        },
        
        /**
        * This function pauses the sound(s) associated with the selected dom element(s)
        * This is a non-desrtuctive call
        **/
        pauseSound: function() {
            $(this).each(function(){
                var gameQuery = this.gameQuery;
                if(gameQuery.sounds) {
                    for(var i = gameQuery.sounds.length-1 ; i >= 0; i --) {
                        gameQuery.sounds[i].pause();
                    }
                }
            });
            return this;
        },
        
        /**
        * this function mute or unmute the selected sound or all the sounds if none is specified
        **/
        muteSound: function(muted) {
            $(this).each(function(){
                var gameQuery = this.gameQuery;
                if(gameQuery.sounds) {
                    for(var i = gameQuery.sounds.length-1 ; i >= 0; i --) {
                        gameQuery.sounds[i].muted(muted);
                    }
                }
            });
        },
        
        /**
        * Register a callback to be trigered every "rate"
        * This is a non-desrtuctive call
        **/
        registerCallback: function(fn, rate) {
            $.gameQuery.resourceManager.registerCallback(fn, rate);
            return this;
        },
        
        /**
        * Set the id of the div to use as a loading bar while the games media are loaded during the preload.
        * If a callback function is given it will be called each time the loading progression changes with 
        * the precentage passed as unique argument.
        * This is a non-desrtuctive call
        **/
        setLoadBar: function(elementId, finalwidth, callback) {
            $.gameQuery.loadbar = {id: elementId, width: finalwidth, callback: callback};
            return this;
        },
        
        /**
         * This function retreive a list of object in collision with the subject:
         * - if 'this' is a sprite or a group, the function will retrieve the list of sprites (not groups) that touch it
         * - if 'this' is the playground, the function will return a list of all pair of collisioning elements. They are represented 
         *    by a jQuery object containing a series of paire. Each paire represents two object colliding.(not yet implemented)
         * For now all abject are considered to be boxes.
         * This IS a desrtuctive call and should be terminated with end() to go back one level up in the chaining
         **/
        collision: function(filter){
            var resultList = [];
            
            //retrieve 'this' offset by looking at the parents
            var itsParent = this[0].parentNode, offsetX = 0, offsetY = 0;
            while (itsParent != $.gameQuery.playground[0]){
                    if(itsParent.gameQuery){
                    offsetX += itsParent.gameQuery.posx;
                    offsetY += itsParent.gameQuery.posy;
                }
                itsParent = itsParent.parentNode;
            }
            
            // retrieve 'this' absolute position and size information
            var gameQuery = this[0].gameQuery;
            if(gameQuery.transformed) {
                var itsGeom = {
                        top:      gameQuery.bB.posy+offsetY, 
                        left:     gameQuery.bB.posx+offsetX,
                        rx:       gameQuery.bB.rx,
                        ry:       gameQuery.bB.ry,
                        angle:    gameQuery.rotate_angle,
                        geometry: gameQuery.geometry
                    };
                itsGeom.right =   itsGeom.left + gameQuery.bB.width;
                itsGeom.bottom =  itsGeom.top + gameQuery.bB.height;
            } else {
                var itsGeom = {
                        top:      gameQuery.posy+offsetY, 
                        left:     gameQuery.posx+offsetX,
                        rx:       gameQuery.width/2,
                        ry:       gameQuery.height/2,
                        angle:    0,
                        geometry: gameQuery.geometry
                    };
                itsGeom.right =   itsGeom.left + gameQuery.width;
                itsGeom.bottom =  itsGeom.top + gameQuery.height;
            }
            
            // retrieve the playground's absolute position and size information
            var pgdGeom = {top: 0, left: 0, bottom: $.playground().height(), right: $.playground().width()};
            
            // Does 'this' is inside the playground ?
            if((itsGeom.bottom < pgdGeom.top)&&(itsGeom.right < pgdGeom.left)&&
               (itsGeom.top > pgdGeom.bottom)&&(itsGeom.left > pgdGeom.right)){
                return this.pushStack(new $([]));
            }
            
            if(this == $.gameQuery.playground){ 
                //TODO Code the "all against all" collision detection and find a nice way to return a list of pairs of elements
            } else {
                // we must find all the element that touches 'this'
                var elementsToCheck = new Array();
                elementsToCheck.push($.gameQuery.sceengraph.children(filter).get());
                elementsToCheck[0].offsetX = 0;
                elementsToCheck[0].offsetY = 0;
                
                for(var i = 0, len = elementsToCheck.length; i < len; i++) {
                    var subLen = elementsToCheck[i].length;
                    while(subLen--){
                        var elementToCheck = elementsToCheck[i][subLen];
                        // is it a sprite ?
                        if(elementToCheck.gameQuery){
                            if(elementToCheck.gameQuery.transformed) {
                                var eleGeom = {
                                        top:      elementToCheck.gameQuery.bB.posy + elementsToCheck[i].offsetY, 
                                        left:     elementToCheck.gameQuery.bB.posx + elementsToCheck[i].offsetX,
                                        rx:       elementToCheck.gameQuery.bB.rx,
                                        ry:       elementToCheck.gameQuery.bB.ry,
                                        angle:    elementToCheck.gameQuery.rotate_angle,
                                        geometry: elementToCheck.gameQuery.geometry
                                    };
                                eleGeom.right =   eleGeom.left + elementToCheck.gameQuery.bB.width;
                                eleGeom.bottom =  eleGeom.top + elementToCheck.gameQuery.bB.height;
                            } else {
                                var eleGeom = {
                                        top:      elementToCheck.gameQuery.posy + elementsToCheck[i].offsetY, 
                                        left:     elementToCheck.gameQuery.posx + elementsToCheck[i].offsetX,
                                        rx:       elementToCheck.gameQuery.width/2,
                                        ry:       elementToCheck.gameQuery.height/2,
                                        angle:    0,
                                        geometry: elementToCheck.gameQuery.geometry
                                    };
                                eleGeom.right =   eleGeom.left + elementToCheck.gameQuery.width;
                                eleGeom.bottom =  eleGeom.top + elementToCheck.gameQuery.height;
                            }
                            
                            if(!elementToCheck.gameQuery.group){
                                // does it touches the selection?
                                if(this[0]!=elementToCheck){
                                    if($.gameQuery.collide(itsGeom, eleGeom)) {
                                        resultList.push(elementsToCheck[i][subLen]);
                                    }
                                }
                            }
                            var eleChildren = $(elementToCheck).children(filter);
                            if(eleChildren.length){
                                elementsToCheck.push(eleChildren.get());
                                elementsToCheck[len].offsetX = eleGeom.left;
                                elementsToCheck[len].offsetY = eleGeom.top;
                                len++;
                            }
                        }
                    }
                }
                return this.pushStack($(resultList));
            }
        },
        
        /**
         * This is an internal function doing the combine action of rotate and scale
         **/
        transform: function(angle, factor) {
            var gameQuery = this[0].gameQuery;
            var angle_rad = Math.PI * 2 / 360 * angle;
            
            // Mark transformed and compute bounding box
            gameQuery.transformed = true;
            gameQuery.bB = {
                    width:  Math.abs(Math.cos(angle_rad) * gameQuery.width * factor) + Math.abs(Math.sin(angle_rad) * gameQuery.height * factor),
                    height: Math.abs(Math.sin(angle_rad) * gameQuery.width * factor) + Math.abs(Math.cos(angle_rad) * gameQuery.height * factor),
                    rx: gameQuery.width  * factor / 2,
                    ry: gameQuery.height * factor / 2
                };
            gameQuery.bB.posx = gameQuery.posx - (gameQuery.bB.width  - gameQuery.width) / 2;
            gameQuery.bB.posy = gameQuery.posy - (gameQuery.bB.height - gameQuery.height) / 2;
            
            if(this.css("MozTransform")) {
                // For firefox from 3.5
                var transform = "rotate("+angle+"deg) scale("+factor+")";
                this.css("MozTransform",transform);
            } else if(this.css("WebkitTransform")!==null && this.css("WebkitTransform")!==undefined) {
                // For safari from 3.1 (and chrome)
                var transform = "rotate("+angle+"deg) scale("+factor+")";
                this.css("WebkitTransform",transform);
            } else if(this.css("filter")!==undefined){
                // For ie from 5.5
                var cos = Math.cos(angle_rad) * factor;
                var sin = Math.sin(angle_rad) * factor;
                var previousWidth = this.width();
                var previousHeight = this.height();
                this.css("filter","progid:DXImageTransform.Microsoft.Matrix(M11="+cos+",M12="+(-sin)+",M21="+sin+",M22="+cos+",SizingMethod='auto expand',FilterType='nearest neighbor')");
                var newWidth = this.width();
                var newHeight = this.height();
                this.css("left", ""+(gameQuery.posx-(newWidth-previousWidth)/2)+"px");
                this.css("top", ""+(gameQuery.posy-(newHeight-previousHeight)/2)+"px");
            }
            return this;
        },
        
        /**
         * This function rotates the selected element(s) clock-wise. The argument is a degree.
         **/
        rotate: function(angle){
            var gameQuery = this[0].gameQuery;
            
            if(angle) {
                var factor = this.scale();
                angle = angle % 360;
                gameQuery.rotate_angle = angle;
                return this.transform(angle, factor);
            } else {
                var ang = gameQuery.rotate_angle;
                return ang ? ang : 0;
            }
        },
        
        /**
         * This function change the scale of the selected element(s). The passed argument is a ratio: 
         * 1.0 = original size
         * 0.5 = half the original size
         * 2.0 = twice the original size
         **/
        scale: function(factor){
            var gameQuery = this[0].gameQuery;
            
            if(factor) {
                var angle = this.rotate();
                gameQuery.scale_factor = factor;
                return this.transform(angle, factor);
            } else {
                var fac = gameQuery.scale_factor;
                return fac ? fac : 1;
            }
        }
	});
    
	// This is an hijack to keep track of the change in the sprites, and group positions and size
	var oldCssFunction = $.fn.css;
	$.fn.css = function(key, value) {
        var returnVal = oldCssFunction.apply(this, new Array(key, value));
		if(!$.gameQuery.playground.disableCollision && (this.length > 0) && this[0].gameQuery && value){
            var gameQuery = this[0].gameQuery;
			if(key == "top"){
				gameQuery.posy = parseFloat(value);
			} else if(key == "left"){
				gameQuery.posx = parseFloat(value);
			} else if(key == "width"){
				gameQuery.width = parseFloat(value);
			} else if (key == "height"){
				gameQuery.height = parseFloat(value);
			}
            // was the object transformed ? then we need to update the bounding box:
            if(gameQuery.transformed){
                gameQuery.bB.posx = gameQuery.posx - (gameQuery.bB.width  - gameQuery.width) / 2;
                gameQuery.bB.posy = gameQuery.posy - (gameQuery.bB.height - gameQuery.height) / 2;
            }
		}
		return returnVal;
	};
	
})(jQuery);