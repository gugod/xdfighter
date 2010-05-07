var PLAYGROUND_WIDTH = 800 ;
var PLAYGROUND_HEIGHT = 200;

function create_cvs(name, position, callback) {
    //Fighters
    var cvs = {
        currentState : IDLE,
        position: position,
        animations: [ {animation: new $.gameQuery.Animation({	imageURL: "/images/xd_idle_59x106x6.png",
								numberOfFrame: 6,
								delta: 59,
								rate:240,
								type: $.gameQuery.ANIMATION_HORIZONTAL | $.gameQuery.ANIMATION_CALLBACK}),
		       deltaX: 0, deltaY: 0, width: 59, height: 106},
                      {animation: new $.gameQuery.Animation({	imageURL: "/images/xd_walk_forward_58x106x5.png",
								numberOfFrame: 5,
								delta: 58,
								rate:240,
								type: $.gameQuery.ANIMATION_HORIZONTAL | $.gameQuery.ANIMATION_CALLBACK}),
		       deltaX: 0, deltaY: 0, width: 58, height: 106},
                      {animation: new $.gameQuery.Animation({	imageURL: "/images/xd_walk_backward_58x106x5.png",
								numberOfFrame: 5,
								delta: 58,
								rate:240,
								type: $.gameQuery.ANIMATION_HORIZONTAL | $.gameQuery.ANIMATION_CALLBACK}),
		       deltaX: 0, deltaY: 0, width: 58, height: 106},
                      {animation: new $.gameQuery.Animation({	imageURL: "/images/xd_punch_120x104x6.png",
								numberOfFrame: 6,
								delta: 120,
								rate:120,
								type: $.gameQuery.ANIMATION_HORIZONTAL | $.gameQuery.ANIMATION_CALLBACK}),
		       deltaX: 0, deltaY: 2, width: 120, height: 104},
                      {animation: new $.gameQuery.Animation({	imageURL: "/images/xd_kick_156x106x9.png",
								numberOfFrame: 9,
								delta: 156,
								rate:90,
								type: $.gameQuery.ANIMATION_HORIZONTAL | $.gameQuery.ANIMATION_CALLBACK}),
		       deltaX: -20, deltaY: 0, width: 156, height: 106},
                      {animation: new $.gameQuery.Animation({	imageURL: "/images/xd_block_69x99x2.png",
								numberOfFrame: 2,
								delta: 69,
								rate:480,
								type: $.gameQuery.ANIMATION_HORIZONTAL | $.gameQuery.ANIMATION_CALLBACK}),
		       deltaX: 0, deltaY: 7, width: 69, height: 99},
                      {animation: new $.gameQuery.Animation({	imageURL: "/images/xd_hit_59x103x1.png",
            						        rate: 720,
                					        type: $.gameQuery.ANIMATION_CALLBACK}),
		       deltaX: 0, deltaY: 3, width: 59, height: 103}]
    }
    $("#fighters").addSprite(name,
			     {posx: position,
			      posy: 70,
			      height: 106,
			      width: 58,
			      animation: cvs.animations[0].animation,
                              geometry: $.gameQuery.GEOMETRY_RECTANGLE,
                              callback: callback});
    $("#"+name).data("fighter", cvs);
    return cvs;
}

$(function(){
    // This is the AI that determines the next move 
    // level=0: totaly random
    // level=1: totaly "rational"
    
    // possible move;
    IDLE=          0;
    WALK_FORWARD=  1;
    WALK_BACKWARD= 2;
    PUNCH=         3;
    KICK=          4;
    BLOCK=         5;
    BEATEN=        6;
    
    //constantes:
    NEAR=         100;
    
    // this is a methods that returns a random element from the given array
    function or(choice){
        return choice[Math.round(Math.random()*(choice.length-1))];
    };
    
    // return the distance between the opponents
    function distance(a, b){
        return Math.abs(a.position().left-b.position().left);
    };
    
    function nextMove(level, a, b){
        if(Math.random() > level){
            return Math.round(Math.random()*5);
        }
        switch(b.data("fighter").currentState){
            // if the adversary is idle or moves away from us we get near him or attack ihm
        case IDLE: 
        case WALK_BACKWARD: 
        case BLOCK: 
            if(distance(a,b) < NEAR){
                return or([KICK, PUNCH, WALK_BACKWARD]);
            } else {
                return or([WALK_FORWARD, IDLE]);
            }
            break;
            // if the adversary moves toward us we get away or attack ihm
        case WALK_FORWARD: 
            if(distance(a,b) < NEAR){
                return or([KICK, PUNCH, WALK_BACKWARD]);
            } else {
                return or([WALK_FORWARD, IDLE]);
            }
            break;
            // if we are under attack we either block go back or try to fight back
        case PUNCH: 
        case KICK:
            return or([BLOCK, PUNCH, KICK, IDLE]);
            break;
            // if beaten we block or go back
        case BEATEN: 
            return or([BLOCK, WALK_BACKWARD, IDLE]);
            break;
        }
    }

    function animate(sprite){
        sprite = $(sprite);
        fighter = sprite.data("fighter");
        adversary = $(fighter.adversary);
        adversaryFighter = adversary.data("fighter");
        
        var nextState = nextMove(0.8, sprite, adversary);
        
        changeAnimation(sprite, fighter.animations, nextState, fighter.currentState);
        
        if(nextState == PUNCH || nextState == KICK){
            sprite.css("z-index", 20);
        } else if(fighter.currentState == PUNCH || fighter.currentState == KICK){
            sprite.css("z-index", undefined);
        }
        
        fighter.currentState = nextState;
    }

    var scrollStage = function (offset){
    	
    	if(offset > 50){
    	    offset = 50;
    	} else if(offset < -50) {
    	    offset = -50;
    	}
    	$("#foreground").css("left", ""+(-800 + offset/0.5)+"px");
        
        $("#ground").css("left", ""+(-300 + offset)+"px");
        $("#fighters").css("left", ""+ offset +"px");
        
        $("#background1").css("left", ""+(50 + offset/2)+"px");
        $("#background2").css("left", ""+(30 + offset/4)+"px");
        $("#background3").css("left", ""+(90 + offset/5)+"px");
    	
    }
    
    /*replace with new*/
    var changeAnimation = function(sprite, animationArry, newAnimation , oldAnimation, cb){
        sprite
            .setAnimation(animationArry[newAnimation].animation, cb)
            .width(animationArry[newAnimation].width)
            .height(animationArry[newAnimation].height)
            .css("left", sprite.position().left + animationArry[newAnimation].deltaX - animationArry[oldAnimation].deltaX);
        // XXX: buggy
        //            .css("top",  sprite.position().top  + animationArry[newAnimation].deltaY - animationArry[oldAnimation].deltaY)
    };
    
    // the game
    $("#playground").playground({height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH, refreshRate: 30, keyTracker: false});
    
    //Playground Sprites
    var foreground 	= new $.gameQuery.Animation({imageURL: "/test/stage/foreground.png", type: $.gameQuery.ANIMATION_VERTICAL});
    var ground 		= new $.gameQuery.Animation({imageURL: "/test/stage/ground.png"});
    var background1 = new $.gameQuery.Animation({imageURL: "/test/stage/background1.png"});
    var background2 = new $.gameQuery.Animation({imageURL: "/test/stage/background2.png"});
    var background3 = new $.gameQuery.Animation({imageURL: "/test/stage/background3.png"});
    $.playground().addSprite(	"background3",
				{posx: 90, posy: 0,
				 height: 200, width: 534,
				 animation: background3})
	.addSprite(	"background2",
			{posx:30, posy: -50,
			 height: 180, width: 432,
			 animation: background2})
	.addSprite(	"background1",
			{posx:50, posy: -150,
			 height: 317, width: 749,
			 animation: background1})
	.addSprite(	"ground",
			{posx: -300, posy: 0,
			 height: 200, width: 1493,
			 animation: ground}).addGroup("fighters").end()
	.addSprite(	"foreground",
			{posx:-800, posy: 165,
			 height: 44, width: 2000,
			 animation: foreground});
    $("#sceengraph").css("background-color","#121423");

    var cvs1 = create_cvs("cvs1", 250);
    var cvs2 = create_cvs("cvs2", 450, animate);
    
    cvs2.adversary = "#cvs1";
    cvs1.adversary = "#cvs2";
    var _cvs1 = $('#cvs1');
    var _cvs2 = $('#cvs2').addClass('flip-horizontal');

    //register the main callback
    $.playground().registerCallback(function(){
	var cvs = $("#cvs1");
        var cvsF = cvs.data("fighter");
        var cvsLeft = cvs.position().left;
        
        var abobo = $("#cvs2");
        var aboboF = abobo.data("fighter");
        var aboboLeft = abobo.position().left;
        

	//hit?
	if(cvsLeft+cvsF.animations[cvsF.currentState].width - 2 > aboboLeft){
	    if((cvsF.currentState == KICK || cvsF.currentState == PUNCH) && aboboF.currentState != BEATEN){
		if (aboboF.currentState == KICK || aboboF.currentState == PUNCH) {
		    changeAnimation(abobo, aboboF.animations, BEATEN, aboboF.currentState);
		    aboboF.currentState = BEATEN;
		    changeAnimation(cvs, cvsF.animations, BEATEN, cvsF.currentState);
		    cvsF.currentState = BEATEN;
		} else {
		    changeAnimation(abobo, aboboF.animations, BEATEN, aboboF.currentState);
		    aboboF.currentState = BEATEN;
		}
	    } else if ((aboboF.currentState == KICK || aboboF.currentState == PUNCH) && cvsF.currentState != BEATEN) {
		changeAnimation(cvs, cvsF.animations, BEATEN, cvsF.currentState);
		cvsF.currentState = BEATEN;
	    }
	}
	
	//Move
        

        if(cvsF.currentState == WALK_FORWARD){
            if((cvsLeft+cvsF.animations[cvsF.currentState].width+2) < aboboLeft){
            	cvs.css("left", cvsLeft+2);
            }
        } else if ((cvsLeft > 50) && (cvsF.currentState == WALK_BACKWARD)){
            cvs.css("left", cvsLeft-2)
        }
        
        if(aboboF.currentState == WALK_FORWARD){
            if((cvsLeft+cvsF.animations[cvsF.currentState].width+2) < aboboLeft){
            	abobo.css("left", aboboLeft - 2);
            }
        } else if ((aboboLeft < 650) && (aboboF.currentState == WALK_BACKWARD)){
            abobo.css("left", aboboLeft + 2);
        }
        
        var al = abobo.position().left - aboboF.animations[aboboF.currentState].deltaX;
        var cl = cvs.position().left - cvsF.animations[cvsF.currentState].deltaX;
        
        var centerPos = (al - cl)/2 + cl;
        scrollStage(-(centerPos-400)*0.5);
        
	return false;
    }, 30);
    
    //initialize the start button
    $.playground().startGame(function(){
	$("#welcomMessage").fadeOut(2000, function(){$(this).remove()});
    });

    var cvs = $("#cvs1");
    var cvsF = cvs.data("fighter");
    var accepting_key = 1;
    var cb = function() {
        changeAnimation(cvs, cvsF.animations, IDLE, cvsF.currentState, cb);
        cvsF.currentState = IDLE;
        accepting_key = 1;
    }

    $(document).keydown(function(e) {
        if (!accepting_key)
            return;
        var nextState = IDLE;
        var keyCode = e.keyCode || e.which,
        arrow   = {left: 37, up: 38, right: 39, down: 40 };
        switch (keyCode) {
        case arrow.left:
            nextState = WALK_BACKWARD;
            break;
        case arrow.right:
            nextState = WALK_FORWARD;
            break;
        case 32:
            nextState = PUNCH;
            break;
        case 13:
            nextState = KICK;
            break;
        }

        if (nextState != cvsF.currentState) {
            changeAnimation(cvs, cvsF.animations, nextState, cvsF.currentState, cb);
            if (nextState == PUNCH || nextState == KICK) {
                accepting_key = 0;
                cvs.css("z-index", 25);
            } else if(cvsF.currentState == PUNCH || cvsF.currentState == KICK){
                cvs.css("z-index", undefined);
            }
            cvsF.currentState = nextState;
        }

    });

    function update_fighter(data) {
        var nextState = IDLE;
        switch(data.move) {
        case "walk_left":
            nextState = WALK_BACKWARD;
            break;
        case "walk_right":
            nextState = WALK_FORWARD;
            break;
        case "punch":
            nextState = PUNCH;
            break;
        case "kick":
            nextState = KICK;
            break;
        }

        if (nextState != cvsF.currentState) {
            changeAnimation(cvs, cvsF.animations, nextState, cvsF.currentState, cb);
            if (nextState == PUNCH || nextState == KICK) {
                accepting_key = 0;
                cvs.css("z-index", 25);
            } else if(cvsF.currentState == PUNCH || cvsF.currentState == KICK){
                cvs.css("z-index", undefined);
            }
            cvsF.currentState = nextState;
        }
    };

    var ws;
    var cookieName = 'xdfighter_ident';
    var timer_update;

    hpipe = new Hippie.Pipe();
    hpipe.args = "arena";

    var status = $('#connection-status');
    jQuery(hpipe)
        .bind("connected", function () {
            status.addClass("connected").text("Connected");
            if(timer_update) clearTimeout(timer_update);
        })
        .bind("disconnected", function() {
            status.removeClass("connected").text("Server disconnected. ");
        })
        .bind("reconnecting", function(e, data) {
            var retry = new Date(new Date().getTime()+data.after*1000);
            var try_now = $('<span/>').text("Try now").click(data.try_now);
            var timer = $('<span/>');
            var do_timer_update = function() {
                timer.text( Math.ceil((retry - new Date())/1000) + "s. " )
                timer_update = window.setTimeout( do_timer_update, 1000);
            };
            status.text("Server disconnected.  retry in ").append(timer).append(try_now);
            do_timer_update();
        })
        .bind("message.move", function (e, data) {
            try {
                var x = data.player + "P " + data.move;
                $('#content').prepend(x + "<br>");
                update_fighter(data);
            } catch(e) { if (console) console.log(e) }
        });

    hpipe.init();
});
