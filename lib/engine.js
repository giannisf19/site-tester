var phantomas = require('phantomas'),
    jsonDb = require('node-json-db'),
    db = new jsonDb('./db/db.json', true, true),
    testResult = require('./testResult.js'),
    _ = require('lodash');

var running = false;


module.exports.runNow = function runNow() {



    if (!running && settings.urls.length) {


       runTest()

    }
    else {
        console.log( "Test already running");
    }

};



function getPhantomSettings(url,sets) {

    var fixedUrl = url.split('//')[1] || url;

    var screenshot = sets.screenshot ? './screens/' + fixedUrl + '.png' : '';
    console.log(screenshot)
    return {screenshot:  screenshot}
}

function runTest() {
    var settings = db.getData('./settings');
    var results = [];
    var count = 0;
    _.forEach(settings.urls, function(url) {

        var phantomSettings = getPhantomSettings(url,settings);
        count++;
        running = true;
        phantomas(url, phantomSettings, function(err, result) {
            count--;

            results.push(new testResult(result));

            if (count == 0) {
                db.push('./history', results);
                running = false;
            }

        });
    });
}