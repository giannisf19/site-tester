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

db = new Jsondb('./db/db.json', true, true);

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
    var urls = [];

    app.locals.activePage = 'main';



    _.forEach(results, function(item){
        dates.unshift(Object.keys(item)[0]);
    });

    _.forEach(results.pop(), function(item) {
        _.forEach(item, function(current){
            urls.unshift(current.url);
        });
    });

    app.locals.urls = urls;
    app.locals.dates = dates;
    app.locals.settings = JSON.stringify(db.getData('./settings'));
    app.locals.host = req.headers.host.toString();
    res.render('index');
});


app.get('/conf', function(req, res){
    db.reload();
    app.locals.activePage = 'conf';
    app.locals.settings = JSON.stringify(db.getData('./settings'));
    app.locals.host = req.headers.host.toString();
    res.render('conf');
});


app.post('/saveSettings', function(req,res){
    db.push('./settings', req.body.settings);
    res.send('Ok');
});



app.post('/runNow', function(req, res) {
    testEngine.runNow();
});

app.post('/deleteDb', function() {
    helper.ClearHistory();
});




app.post('/api/', function(req, res) {
    res.json({
        message: "Site tester api"
    }) ;
});












io.on('connection', function(socket) {
    globalSocket = socket;
    testEngine.setSocket(globalSocket);

});



//fs.writeFileSync('test.json', JSON.stringify(parser.GetDataByPage()));


server.listen(300, function() {
    console.log('Listening on port ' + server.address().port);
});