var phantomas = require('phantomas'),
    jsonDb = require('node-json-db'),
    db = new jsonDb('./db/db.json', true, true),
    testResult = require('./testResult.js'),
    _ = require('lodash');

var running = false;


function Engine() {
    this.socket = {emit: function() {console.log('Mock emit!')}};
}

Engine.prototype.runNow = function() {
    var self = this;
    var settings = db.getData('./settings');


    if (!running && settings.urls.length) {

        var results = db.getData('/history');
        var count = 0;
        _.forEach(settings.urls, function(url) {

            var phantomSettings = getPhantomSettings(url,settings);
            count++;
            running = true;
            self.socket.emit('isRunning', {isRunning: true});
            console.log('Test started...');
            phantomas(url, phantomSettings, function(err, result) {
                count--;

                results.push(new testResult(result));

                if (count == 0) {
                    db.push('./history', results);
                    running = false;
                    self.socket.emit('isRunning', {isRunning: false});
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
};

function getPhantomSettings(url,sets) {

    var fixedUrl = url.split('//')[1] || url;

    var screenshot = sets.screenshot ? './screens/' + fixedUrl + '.png' : '';
    console.log(screenshot);
    return {screenshot:  screenshot}
}


module.exports = Engine;