var express = require('express'),
    app = new express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    fs = require('fs'),
    engine = require('./lib/engine.js');

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));
app.locals.pretty = true;


var test = new engine('http://google.com', {});






app.get('/', function(req, res) {
    app.locals.activePage = 'main'
    res.render('index');
});


app.get('/conf', function(req, res){
    app.locals.activePage = 'conf'
    app.locals.settings =  JSON.stringify({urls: ['ena', 'dio']});
    res.render('conf');
});

server.listen(300, function() {
    console.log('Listening on port ' + server.address().port);
})