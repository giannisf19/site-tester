var phantomas = require('phantomas'),
    jsonDb = require('node-json-db'),
    testResult = require('./testResult.js'),
    helper = require('./helper'),
     moment = require('moment');
     _ = require('lodash');


helper.Init();
var db = new jsonDb('./db/db.json', true, true);




function Engine() {
    this.socket = {emit: function() {console.log('Mock emit!')}};
    this.running = false;
}

Engine.prototype.runNow = function() {
    var self = this;
    var settings = db.getData('./settings');
    var obj = {};
    var date = moment();

    obj[date] = [];

    if (!self.running && settings.urls.length) {
        console.log('Test started...');

        var results = db.getData('/history');
        var count = 0;
        _.forEach(settings.urls, function(url) {

            var phantomSettings = getPhantomSettings(url,settings);
            count++;
            self.running = true;
            self.socket.emit('isRunning', {isRunning: true});
            phantomas(url, phantomSettings, function(err, result) {
                count--;

               obj[date].push(new testResult(url, result));

                if (count == 0) {
                    results.push(obj);
                    db.push('./history', results);
                    running = false;
                    self.socket.emit('isRunning', {isRunning: false});
                    self.running = false;
                    console.log('Test finished');
                }

            });
        });

    }
    else {
        console.log( "Test already running");
    }

};

Engine.prototype.setSocket = function(socket) {
    this.socket = socket;
    var self = this;
    this.socket.emit('isRunning', {isRunning : self.running})
};

function getPhantomSettings(url,sets) {

    var fixedUrl = url.split('//')[1] || url;

    var screenshot = sets.screenshot ? './screens/' + fixedUrl + '.png' : '';
    return {screenshot:  screenshot}
}


module.exports = Engine;