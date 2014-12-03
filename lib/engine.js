var phantomas = require('phantomas'),
    jsonDb = require('node-json-db'),
    testResult = require('./testResult.js'),
    helper = require('./helper'),
    moment = require('moment'),
    CronJob = require('cron').CronJob,
     _ = require('lodash');


helper.Init();




function Engine() {
    this.socket = {emit: function() {console.log('Mock emit!')}};
    this.running = false;
    this.mockJob = {running: false, cronTime: {source: ''}};
    this.job = this.mockJob;
}

Engine.prototype.runNow = function() {
    var db = new jsonDb('./db/db.json', true, true);


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

               obj[date].push(new testResult(url, result, phantomSettings.screenshot));


                // last result

                if (count == 0) {
                    results.push(obj);
                    db.push('./history', results);
                    db.save();
                    running = false;

                    // notify the client
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
    this.socket.emit('isRunning', {isRunning : self.running});
    this.socket.emit('SchedulerData', {data: {isSet: this.job.running, cron: this.job.cronTime.source}})

};

function getPhantomSettings(url,sets) {

    var fixedUrl = url.split('//')[1] || url;

    var screenshot = sets.screenshot ? './public/screens/' + fixedUrl + '.png' : '';
    return {screenshot:  screenshot}
}


Engine.prototype.Schedule = function(cron) {
    var self = this;


    // Only 1 instance of the scheduler can run

    if (!this.job.running) {

        this.job = new CronJob(cron, function(){
            self.runNow();
        }, null, true);


        // inform the client
        this.socket.emit('SchedulerData', {data: {isSet: this.job.running, cron: this.job.cronTime.source}});

    }


};


Engine.prototype.StopScheduler = function() {

  if (this.job.running) {
      this.job.stop();
      this.socket.emit('SchedulerData', {data: {isSet: this.job.running, cron: this.job.cronTime.source}})
  }
};

module.exports = Engine;