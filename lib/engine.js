var phantomas = require('phantomas'),
    jsonDb = require('node-json-db'),
    testResult = require('./testResult.js'),
    helper = require('./helper'),
    moment = require('moment'),
    CronJob = require('cron').CronJob,
    async = require('async'),
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

            async.eachSeries(settings.urls, function(url, callback){

                    // parse and clean the url from www and prepend http if not exists
                    var fixedUrl = fixUrl(url);

                    var phantomSettings = getPhantomSettings(fixedUrl,settings);
                    count++;



                    self.running = true;
                    self.socket.emit('isRunning', {isRunning: true});

                    phantomas(fixedUrl, phantomSettings, function(err, result) {
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

                // call the callback to execute next url
                callback();
            });
       // });

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


    // we don't want / in url

    var fixedUrl = url.split('/').join('') || url;

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



function fixUrl(url) {

    //we don't want www in url
    url = url.split('www.')[1] || url;


    // but we want http
    if (!url.match(/^[a-zA-Z]+:\/\//))
    {
        url = 'http://' + url;
    }


    return url;
}




Engine.prototype.test = function(url) {
    console.log(fixUrl(url));
}

module.exports = Engine;