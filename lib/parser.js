/**
 * Created by gfoulidis on 20/11/2014.
 */

var jsonDb = require('node-json-db'),
    helper = require('./helper'),
    _ = require('lodash');


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