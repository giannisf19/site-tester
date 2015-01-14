var phantomas = require('phantomas'),
    jsonDb = require('node-json-db'),
    moment = require('moment'),
    CronJob = require('cron').CronJob,
    async = require('async'),
     _ = require('lodash');






function Engine() {
    this.socket = {emit: function() {console.log('Mock emit!')}};
    this.running = false;
    this.mockJob = {running: false, cronTime: {source: ''}};
    this.job = this.mockJob;
}

Engine.prototype.runNow = function(model) {

    var self = this;


    var conf = new jsonDb('./config/config.json');
    var settings = conf.getData('/settings');

    var obj = {};
    var date = moment();


    obj[date] = [];

    if (!self.running && settings.urls.length) {
        console.log('Test started...');


            async.eachSeries(settings.urls, function(url, callback){

                if (!url.active) {

                    // continue
                    callback();
                }

                    // parse and clean the url from www and prepend http if not exists
                    var fixedUrl = fixUrl(url.url);

                    var phantomSettings = getPhantomSettings(url,settings);

                    self.running = true;
                    self.socket.emit('isRunning', {isRunning: true});

                    phantomas(fixedUrl, phantomSettings, function(err, result) {

                        var models = require('../models');
                            models.Result.build({date: JSON.stringify(date), url: url.url, testResult: JSON.stringify(result), screen: phantomSettings.screenshot}).save();


                      callback();

                    });


            }, function() {
                running = false;

                // notify the client
                self.socket.emit('isRunning', {isRunning: false});
                self.running = false;
                console.log('Test finished');
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

    var tempURL = fixUrl(url.url);

    // we don't want / in url

     var fixedUrl = tempURL.split('/').join('') || tempURL;

    var screenshot = url.screenshot ? './public/screens/' + fixedUrl + '.png' : '';
    return {screenshot:  screenshot}
}


Engine.prototype.Schedule = function(cron, conf, model) {
    var self = this;

       conf.reload();

        var settings = conf.getData('/settings');
    // Only 1 instance of the scheduler can run

    if (!this.job.running) {

        this.job = new CronJob(cron, function(){
            self.runNow(settings, model);
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