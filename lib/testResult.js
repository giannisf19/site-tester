/**
 * Created by gfoulidis on 20/11/2014.
 */
var moment = require('moment');


function testResult(result) {
    this.runDate = moment();
    this.result = result;
}

module.exports = testResult;