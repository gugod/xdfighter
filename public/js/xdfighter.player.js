$(function(){
    var player = (location.hash || "#1").replace(/^#/, "");
    $("#player-id").text(player + "P");
    hpipe = new Hippie.Pipe();
    hpipe.args = "player";

    function init_keybinding() {
        $(document.body).bind("keydown", function(e) {
            var key = null;
            switch(e.keyCode) {
            case 37:
                key = "left";
                break;
            case 38:
                key = "up";
                break;
            case 39:
                key = "right";
                break;
            case 40:
                key = "down";
                break;
            }

            if (key) {
                hpipe.send({ 'player': player, 'key': key });
            }
        });
    }

    var timer_update;
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
        .bind("ready", function() {
            init_keybinding()
        });

    hpipe.init();
});
