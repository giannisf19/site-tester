/**
 * Created by gfoulidis on 20/11/2014.
 */

var jsonDb = require('node-json-db'),
    helper = require('./helper'),
    _ = require('lodash'),
    fs = require('fs');

helper.Init();

var db = new jsonDb('./db/db.json', true,true);


module.exports.GetHistoryByName = function GetHistoryByName(name) {
    db.reload();
    var histories = db.getData('/history');
    var result = {};


    _.forEach(histories, function(history) {

        if (Object.keys(history).pop() == name)
        {
            result = history;
        }

    });

    return result;
};


module.exports.DeleteHistoryByName = function DeleteHistoryByName(name) {
    db.reload();

    var histories = db.getData('/history');

    _.forEach(histories, function(history, index) {

        if (Object.keys(history).pop() == name) {

            console.log('Doing nothing...')
            //db.delete('/history/' + index + '/' + name);
        }
    });

};


module.exports.ClearHistory = function ClearHistory() {

    if (fs.existsSync('./db/db.json'))
    {
        console.log('Deleting..');
        db.push('./history', []);
        db.save();
    }
};
