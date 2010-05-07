# -*- cperl -*-
use common::sense;
use Plack::Builder;
use Plack::Request;
use AnyMQ;

my $bus = AnyMQ->new;
my $player = $bus->topic("player");
my $arena  = $bus->topic("arena");

my $fight_engine = $bus->new_listener($player);

$fight_engine->poll(
    sub {
        my $message = shift;

        my $move = "stand_still";
        given($message->{key}) {
            when(["left", "right"]) {
                if ($message->{player} == 2) {
                    $move = "walk_" . ($message->{key} eq "left" ? "right" : "left");
                }
                else {
                    $move = "walk_" . $message->{key};
                }
            }
            when("up") {
                $move = "jump";
            }
            when("down") {
                $move = "crunch";
            }
            when("p") {
                $move = "punch";
            }
            when("k") {
                $move = "kick";
            }
        }

        my $result = { type => "move", "move" => $move, player => $message->{player}, t => time };
        $arena->publish($result);
    });

builder {
    mount "/_hippie/" => builder {
        enable "+Web::Hippie";
        enable "+Web::Hippie::Pipe", bus => $bus;
        sub {
            my $env = shift;
            my $room = $env->{'hippie.args'};
            my $topic = $env->{'hippie.bus'}->topic($room);
            if ($env->{PATH_INFO} eq '/new_listener') {
                $env->{'hippie.listener'}->subscribe( $topic );
            }
            elsif ($env->{PATH_INFO} eq '/message') {
                my $msg = $env->{'hippie.message'};
                $msg->{time} = time;
                $msg->{address} = $env->{REMOTE_ADDR};
                $topic->publish($msg);
            }
            else {
                my $h = $env->{'hippie.handle'}
                    or return [ '400', [ 'Content-Type' => 'text/plain' ], [ "" ] ];

                if ($env->{PATH_INFO} eq '/error') {
                    warn "==> disconnecting $h";
                }
                else {
                    die "unknown hippie message";
                }
            }
            return [ '200', [ 'Content-Type' => 'application/hippie' ], [ "" ] ]
        };
    };

    mount "/" => builder {
        enable "Static", path => qr{^/(test|pages|images|js|css)/}, root => 'public/';
        sub {
            my $env = shift;
            my $req = Plack::Request->new($env);
            my $res = $req->new_response(200);

            $res->redirect("/pages/index.html");
            return $res->finalize;
        }
    };
};
