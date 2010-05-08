var PLAYGROUND_WIDTH = 800;
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
		       deltaX: 0, deltaY: 3, width: 59, height: 103},
                      {animation: new $.gameQuery.Animation({	imageURL: "/images/xd_qigong_75x99x4.png",
								numberOfFrame: 4,
            						        rate: 200,
                                                                delta: 75,
								type: $.gameQuery.ANIMATION_HORIZONTAL | $.gameQuery.ANIMATION_CALLBACK}),
                       deltaX: 0, deltaY: 3, width: 75, height: 99}
                    ]
    };

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
    TOMATO=        7;
    
    //constantes:
    NEAR=         100;
    
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
    var foreground 	= new $.gameQuery.Animation({imageURL: "/images/stage/foreground.png", type: $.gameQuery.ANIMATION_VERTICAL});
    var ground      = new $.gameQuery.Animation({imageURL: "/images/stage/ground.png"});
    var background1 = new $.gameQuery.Animation({imageURL: "/images/stage/background1.png"});
    $.playground()
	.addSprite(	"background1",
			{posx:50, posy: 0,
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

    var cvshitD = $('<div/>').html('<img src="/images/xd_hit_msg.png"/>').css( {  position:'absolute', left: 0, top: 0 , display: 'none' } );
    var abobohitD = $('<div/>').html('<img src="/images/xd_hit_msg.png"/>').css( {  position:'absolute', left: 0, top: 0 , display: 'none' } );
    $(document.body).append( cvshitD  ).append( abobohitD );

    var cvsLifeBarD = $('<div/>').css( {
        position: 'absolute',
        left:   '10%',
        border: '1px solid blue',
        width:  '200px',
        height: '12px'
    });
    var cvsLifeBar  = $('<div/>').addClass( 'lifebar' );
    cvsLifeBar.css( {  
        border: '1px solid red',
        height: '10px',
        background: 'red',
        width:  '99%'
        } );
    cvsLifeBarD.life = cvsLifeBar;
    cvsLifeBarD.append( cvsLifeBar );


    var lifeBarD = $('<div/>').css( {
        left:   '50%',
        position: 'absolute',
        border: '1px solid blue',
        width:  '200px',
        height: '12px'
    });
    var lifeBar  = $('<div/>').addClass( 'lifebar' );
    lifeBar.css( {  
        border: '1px solid red',
        background: 'red',
        height: '10px',
        width:  '99%'
        } );
    lifeBarD.life = lifeBar;
    lifeBarD.append( lifeBar );

    $(document.body).append( lifeBarD );
    $(document.body).append( cvsLifeBarD );

    var cvs1 = create_cvs("cvs1", 250);
    var cvs2 = create_cvs("cvs2", 450);
    
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

    cvs.lifeBarEl = cvsLifeBarD;
    abobo.lifeBarEl = lifeBarD;

    abobo.reduceLife = cvs.reduceLife = function(val) {
        this.lifeBarEl.life.animate( { width : '-='+ val +'%' }  );
    };
    abobo.increaseLife = cvs.increaseLife = function(val) {
        this.lifeBarEl.life.animate( { width : '+='+ val +'%' }  );
    };

    // debug variable
    _player1 = cvs;
    _player2 = abobo;
        
	//hit?
	if( cvsLeft + cvsF.animations[cvsF.currentState].width - 2 > aboboLeft ){
//        console.log(  'role overlay'  );

	    if((cvsF.currentState == KICK || cvsF.currentState == PUNCH) && aboboF.currentState != BEATEN){

            if (aboboF.currentState == KICK || aboboF.currentState == PUNCH) {
                changeAnimation(abobo, aboboF.animations, BEATEN, aboboF.currentState);
                aboboF.currentState = BEATEN;
                changeAnimation(cvs, cvsF.animations, BEATEN, cvsF.currentState);
                cvsF.currentState = BEATEN;
            } 
            else {
                changeAnimation(abobo, aboboF.animations, BEATEN, aboboF.currentState);
                aboboF.currentState = BEATEN;

//                console.log(  'abobo is beaten.'  );

                if ( cvsF.currentState == KICK ) {
                    abobo.reduceLife( 10 );
                } 
                else if( cvsF.currentState = PUNCH ) {
                    abobo.reduceLife( 5 );
                }

                var pos = abobo.position();
                abobohitD.css(pos).fadeIn( 10 , function() {
                        abobohitD.fadeOut('slow' , function() { 
                                changeAnimation(abobo, aboboF.animations, IDLE, aboboF.currentState);
                                aboboF.currentState = IDLE;
                            } );
                    } );

            }
	    } 
        else if ((aboboF.currentState == KICK || aboboF.currentState == PUNCH) && cvsF.currentState != BEATEN) {
//            console.log(  'cvs is beaten.'  );
            changeAnimation(cvs, cvsF.animations, BEATEN, cvsF.currentState);
            cvsF.currentState = BEATEN;

            if ( aboboF.currentState == KICK ) {
                cvs.reduceLife( 10 );
            } 
            else if( aboboF.currentState = PUNCH ) {
                cvs.reduceLife( 5 );
            }

            cvshitD.css(pos).fadeIn( 10 , function() {
                    cvshitD.fadeOut('slow' , function() { 
                            changeAnimation( cvs, cvsF.animations, IDLE, cvsF.currentState);
                            cvs.currentState = IDLE;
                        } );
                } );
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
    $("#welcomMessage").fadeOut(
        2000,
        function() {
            $(this).remove();
            $.playground().startGame(function(){});
        }
    );


    var cvs = $("#cvs1");
    var cvsF = cvs.data("fighter");
    var accepting_key = 1;

    function update_state($fighter, nextState) {
        var fighter = $fighter.data("fighter");

        if (nextState != fighter.currentState) {
            changeAnimation(
                $fighter,
                fighter.animations,
                nextState,
                fighter.currentState,
                function() {
                    changeAnimation($fighter, fighter.animations, IDLE, fighter.currentState);
                    fighter.currentState = IDLE;
                    accepting_key = 1
                }
            );
            if (nextState == PUNCH || nextState == KICK) {
                accepting_key = 0;
                $fighter.css("z-index", 25);
            } else if(fighter.currentState == PUNCH || fighter.currentState == KICK){
                $fighter.css("z-index", undefined);
            }
            fighter.currentState = nextState;
        }
    }

    function fire_tomato($fighter) {
        var RIGHT_FIGHTER = "cvs2";

        var fighter_id = $fighter.attr("id");
        var tomato_id  = "tomato" + fighter_id;

        if ($("#" + tomato_id).length) return;

        var fighter = $fighter.data("fighter");

        $("#fighters").addSprite(tomato_id, {
            posx: $fighter.position().left + (fighter_id == RIGHT_FIGHTER ? -1 : 1 ) * fighter.animations[fighter.currentState].width,
            posy: $fighter.position().top  + fighter.animations[fighter.currentState].height/4,
	    height: 50,
	    width: 50,
	    animation: new $.gameQuery.Animation({imageURL: "/images/tomato.png", rate: 120, type: $.gameQuery.ANIMATION_HORIZONTAL | $.gameQuery.ANIMATION_CALLBACK}),
            geometry: $.gameQuery.GEOMETRY_RECTANGLE,
            callback: function(tomato) {
                var $tomato = $(tomato);
                var left = $tomato.position().left + 2;

                var $fighter_left  = $("#cvs1");
                var $fighter_right = $("#cvs2");

                if ($tomato.attr("id") == "tomatocvs2") {
                    if(left < $fighter_left.width() + $fighter_left.position().left){
                        $tomato.css("z-index", 25);
                        var f = $fighter_left.data("fighter");
                        changeAnimation($fighter_left, f.animations, BEATEN, f.currentState);
                        f.currentState = BEATEN;
                    }

                    if (left < 10 
                        || left + fighter.animations[fighter.currentState].width
                            - 40 - $fighter_left.width() < $fighter_left.position().left ) {
                        $tomato.css("background-image", "url(/images/tomato_px.png)");
                        window.setTimeout(function() { 
                                $tomato.remove();
                            }, 1000);
                    }
                    else {
                        $tomato.css('left', left - 5).toggleClass('flip-horizontal');
                    }                    
                }
                else {
                    if(left + fighter.animations[fighter.currentState].width - 2 > $fighter_right.position().left){
                        $tomato.css("z-index", 25);
                        var f = $fighter_right.data("fighter");
                        changeAnimation($fighter_right, f.animations, BEATEN, f.currentState);
                        f.currentState = BEATEN;
                    }

                    if (left > 600 || left + fighter.animations[fighter.currentState].width - 40 > $fighter_right.position().left) {
                        $tomato.css("background-image", "url(/images/tomato_px.png)");

                        window.setTimeout(function() { 
                                $tomato.remove();
                            }, 1000);
                    }
                    else {
                        $tomato.css('left', left + 5).toggleClass('flip-horizontal');
                    }
                }
            }
        });
    }

    $(document).keydown(function(e) {
        if (!accepting_key)
            return;
        var nextState = IDLE;
        var keyCode = e.keyCode || e.which;
        var KEYS = { 
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            SPACE: 32,
            ENTER: 13
        };

        switch (keyCode) {

        case KEYS.LEFT:
            nextState = WALK_BACKWARD;
            break;

        case KEYS.RIGHT:
            nextState = WALK_FORWARD;
            break;

        case KEYS.DOWN:
            nextState = BLOCK;
            break;

        case KEYS.SPACE:
            nextState = PUNCH;
            break;

        case KEYS.ENTER:
            nextState = KICK;
            break;

        case 65: // KEY 'a'
            nextState = TOMATO;
            fire_tomato(cvs);
            break;
        }

        update_state(cvs, nextState);

        return false;
    });

    $("#playground").bind("fightermove", function(e, data) {
        var nextState = IDLE;

        switch(data.move) {
        case "punch":
            nextState = PUNCH;
            break;
        case "kick":
            nextState = KICK;
            break;
        case "walk_left":
            nextState = WALK_BACKWARD;
            break;
        case "walk_right":
            nextState = WALK_FORWARD;
            break;
        case "tomato":
            nextState = TOMATO;
            fire_tomato($("#cvs" + data.player));
            break;
        }

        update_state($("#cvs" + data.player), nextState);
    });

});

