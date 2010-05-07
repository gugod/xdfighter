# -*- cperl -*-
use strict;
use Plack::Builder;
use Plack::Request;

builder {
    enable "Static", path => qr{^/(pages|images|js|css)/}, root => 'public/';
    enable "+Web::Hippie";
    sub {
        my $env = shift;
        my $req = Plack::Request->new($env);
        my $res = $req->new_response(200);

        $res->redirect("/pages/index.html");
        return $res->finalize;
    };
};
