var express = require('express'),
    app = new express(),
    server = require('http').Server(app),
    bodyParser = require('body-parser'),
    io = require('socket.io')(server),
    fs = require('fs'),
    engine = require('./lib/engine.js'),
    Jsondb  = require('node-json-db'),
    _ = require('lodash');








var config = new Jsondb('./config/config.json', true, true);


var globalSocket = {};
var testEngine = new engine();

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.disable('x-powered-by');


app.locals.pretty = true;


var models = require('./models');

var dates = [];

app.get('/', function(req, res) {

    app.locals.activePage = 'main';




    models.sequelize.sync()
        .then(function() {
            models.Result.findAll({attributes: ['url', 'date']}).then(function (result) {

                app.locals.urls = _.map(result, function (item) {
                    return item.dataValues.url
                });
                app.locals.dates = _.unique(_.map(result, function(item) {return item.dataValues.date.replace(/"/g, '')}).reverse())

                app.locals.settings = JSON.stringify(config.getData('./settings'));
                app.locals.host = req.headers.host.toString();
                res.render('index');

            });

        });

});


app.get('/conf', function(req, res){
    config.reload();
    app.locals.activePage = 'conf';
    app.locals.settings = JSON.stringify(config.getData('./settings'));
    app.locals.host = req.headers.host.toString();
    res.render('conf');
});


app.post('/api/saveSettings', function(req,res){
    config.reload();
    config.push('./settings', req.body.settings);
    res.send('Ok');
});



app.post('/api/runNow', function(req, res) {
    testEngine.runNow(models, config);
});

app.post('/api/deleteDb', function(req,res) {
    models.sequelize.query('delete from Results').then(function() {
        res.send('ok')
    })
});



app.post('/api/getHistoryNames', function(req, res) {
    models.Result.findAll({attributes: ['url', 'date']}).then(function(result) {
        var dates = _.unique(_.map(result, function(item) {return item.dataValues.date.replace(/"/g, '')}).reverse());

        res.json(JSON.stringify(dates))
    });
});


app.post('/api/', function(req, res) {
    res.json({
        message: "Site tester api"
    }) ;
});





app.post('/api/GetHistoryByName', function(req, res) {


    models.Result.findAll({where: {date: '"' +req.body.name + '"'}}).then(function(result) {


        if (result) {
            var dataTosend = _.map(result, function(item) {obj ={}; return obj[item.dataValues.date.replace(/"/g)] = {screen: item.dataValues.screen,url: item.dataValues.url, result: item.dataValues.testResult}});
            res.json(JSON.stringify({data: dataTosend}));
        }

        else {
            res.json(JSON.stringify({error: 'error'}))
        }

    });

});


app.post('/api/schedule', function(req, res) {

    var models = require('./models');
    testEngine.Schedule(req.body.cron, config,models)
});


app.post('/api/stopSchedule', function(req, res) {
    testEngine.StopScheduler();
});



app.post('/api/deleteHistoryByName', function(req, res) {


    if (req.body.name)
    {
        models.Result.findAll({where: {date: '"' +req.body.name + '"'}}).then(function(items) {
            _.forEach(items, function(item) {
                item.destroy();
            });

            res.send('ok');
        });

    }



});


io.on('connection', function(socket) {
    globalSocket = socket;
    testEngine.setSocket(globalSocket);

});


server.listen(300, function() {
    console.log('Listening on port ' + server.address().port);
});

