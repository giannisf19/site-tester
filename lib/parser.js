/**
 * Created by gfoulidis on 20/11/2014.
 */

var jsonDb = require('node-json-db'),
    helper = require('./helper'),
    _ = require('lodash');


helper.Init();

var db = new jsonDb('./db/db.json', true,true);



module.exports.GetDataByPage = function GetDataByPage() {
    var histories = db.getData('/');
    var result = [];
    var obj = {};

    _.forEach(histories, function(history) {
        console.log(history.result);
        _.forEach(history.result, function(item) {
            if (! _.contains(result, item.url)) {
                result.push({url: item.url, test: [{date : history.runDate, metrics: item.metrics, offenders : item.offenders}]})
            }

            else {
                result[item.url].test.push({date : history.runDate, metrics: item.metrics, offenders : item.offenders});
            }
        })
    });

};