$(window).bind("load", function() {
    setTimeout(function() {
        window.scrollTo(0,1);
    }, 100);
});


$(function(){
    var player = (location.search.match(/player=(\d)/))[1] || 1;

    document.body.addEventListener("touchmove", function(event) { event.preventDefault(); return false; }, false);

    var joystick = document.getElementById("joystick");
    var joyhead  = document.getElementById("joyhead");

    // startX,startY = the center of the joyhead.
    var startX = 124; // 60 (#joyhead left) + 128/2 (#joyhead width  / 2)
    var startY = 124; // 60 (#joyhead top) + 128/2 (#joyhead height / 2)

    joystick.addEventListener("touchmove", function(event) {
        event.preventDefault();
        var e = event.targetTouches[0];
        var curX = e.pageX - startX;
        var curY = e.pageY - startY;
        joyhead.style['-webkit-transform'] = "translate(" + curX + "px," + curY + "px)";

        if (curX < -40 && -40 < curY && curY < 40) {
            hpipe.send({ 'player': player, 'key': 'left' });
        }
        else if (curX > 40 && -40 < curY && curY < 40) {
            hpipe.send({ 'player': player, 'key': 'right' });
        }
        else if (curY < -40 && -40 < curX && curX < 40) {
            hpipe.send({ 'player': player, 'key': 'up' });
        }
        else if (curY >  40 && -40 < curX && curX < 40) {
            hpipe.send({ 'player': player, 'key': 'down' });
        }
        return false;
    }, false);

    joystick.addEventListener("touchend", function(event) {
        event.preventDefault();
        joyhead.style['-webkit-transform'] = "translate(0px, 0px)";
        return false;
    }, false);

    $("#player-id").text(player + "P");
    hpipe = new Hippie.Pipe();
    hpipe.args = "player";

    var KEYS = {
        LEFT: 37,
        RIGHT: 39,
        UP: 38,
        DOWN: 40,
        SPACE: 32,
        ENTER: 13
    };

    function init_joystick() {
//         var keep = {  };
//         $(document.body).bind("keyup", function(e) {
//             switch(e.keyCode) {
//                 case KEYS.SPACE:
// 
//                 break;
//             }
//         });

        $(document.body).bind("keydown", function(e) {
            var key = null;
            switch(e.keyCode) {
            case KEYS.LEFT:
                key = "left";
                break;
            case KEYS.UP:
                key = "up";
                break;
            case KEYS.RIGHT:
                key = "right";
                break;
            case KEYS.DOWN:
                key = "down";
                break;
            }

            if (key) {
                hpipe.send({ 'player': player, 'key': key });
            }
            return false;
        });

        $("#joystick a").bind("touchstart", function(e) {
            var x = $(this).attr("button");
            hpipe.send({ 'player': player, 'key': x });
            return false;
        }).bind("click", function() { $(this).trigger("touchstart") });
    }

    var timer_update;
    jQuery(hpipe)
        .bind("connected", function () {
            if(timer_update) clearTimeout(timer_update);
        })
        .bind("disconnected", function() {
        })
        .bind("reconnecting", function(e, data) {
            var do_timer_update = function() {
                timer_update = window.setTimeout( do_timer_update, 1000);
            };
            do_timer_update();
        })
        .bind("ready", function() {
            init_joystick();
        });

    hpipe.init();
});
