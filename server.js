var express = require('express'),
    app = new express(),
    helper = require('./lib/helper'),
    server = require('http').Server(app),
    bodyParser = require('body-parser'),
    io = require('socket.io')(server),
    fs = require('fs'),
    engine = require('./lib/engine.js'),
    Jsondb  = require('node-json-db'),
    parser = require('./lib/parser');


helper.Init();

db = new Jsondb('./db/db.json', true, true)

var globalSocket = {};
var testEngine = new engine();

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.locals.pretty = true;









app.get('/', function(req, res) {
    db.reload();
    var results = db.getData('./history');
    var dates = [];
    app.locals.activePage = 'main';
    app.locals.urls = JSON.stringify(results[0]);


    _.forEach(results, function(item){
        dates.push(Object.keys(item)[0]);
    });

    app.locals.dates = dates;
    app.locals.settings = JSON.stringify(db.getData('./settings'));
    res.render('index');
});


app.get('/conf', function(req, res){
    db.reload();
    app.locals.activePage = 'conf';
    app.locals.settings = JSON.stringify(db.getData('./settings'));
    res.render('conf');
});


app.post('/saveSettings', function(req,res){
    db.push('./settings', req.body.settings);
});



app.post('/runNow', function(req, res) {
    testEngine.runNow();
});

app.post('/deleteDb', function() {
    helper.ClearHistory();
});

io.on('connection', function(socket) {
    globalSocket = socket;
    testEngine.setSocket(globalSocket);

});



//fs.writeFileSync('test.json', JSON.stringify(parser.GetDataByPage()));


server.listen(300, function() {
    console.log('Listening on port ' + server.address().port);
});