var express = require('express'),
    app = new express(),
    server = require('http').Server(app),
    bodyParser = require('body-parser'),
    io = require('socket.io')(server),
    fs = require('fs'),
    engine = require('./lib/engine.js'),
    Jsondb  = require('node-json-db'),
    db = new Jsondb('./db/db.json', true, true),
    helper = require('./lib/helper');


helper.Init();

var globalSocket = {};

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.locals.pretty = true;


var test = new engine('http://google.com', {});







app.get('/', function(req, res) {
    app.locals.activePage = 'main';
    app.locals.result = db.getData('./history');
    app.locals.settings = JSON.stringify(db.getData('./settings'));
    res.render('index');
});


app.get('/conf', function(req, res){
    app.locals.activePage = 'conf';
    app.locals.settings = JSON.stringify(db.getData('./settings'));
    res.render('conf');
});


app.post('/saveSettings', function(req,res){
    db.push('./settings', req.body.settings);
});



app.post('/runNow', function(req, res) {

});



io.on('connection', function(socket) {
    globalSocket = socket;
    globalSocket.emit('isRunning', {isRunning: false})

});





server.listen(300, function() {
    console.log('Listening on port ' + server.address().port);
});