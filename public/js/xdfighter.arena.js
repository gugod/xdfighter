$(function(){
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
            } catch(e) { if (console) console.log(e) }
        });

    hpipe.init();
});
