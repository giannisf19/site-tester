/**
 * Created by gfoulidis on 20/11/2014.
 */

var jsonDb = require('node-json-db'),
    helper = require('./helper'),
    _ = require('lodash');


helper.Init();

var db = new jsonDb('./db/db.json', true,true);



module.exports.GetDataByPage = function GetDataByPage() {
    var histories = db.getData('/history');
    var result = [];
    var obj = {};



    _.forEach(histories, function(history) {

            console.log(history.url)
            //if (! _.contains(result, history.url)) {
            //     obj[item.url] =  { test: [{date : history.runDate, metrics: item.metrics, offenders : item.offenders}]};
            //   // console.log(item)
            //
            //    result.push(obj)
            //}
            //
            //else {
            //    result[item.url].test.push({date : history.runDate, metrics: item.metrics, offenders : item.offenders});
            //    console.log('Gia na doume erxetai edo');
            //}
        });


        return result;
};