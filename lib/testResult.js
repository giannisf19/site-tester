/**
 * Created by gfoulidis on 20/11/2014.
 */
var moment = require('moment');


function testResult(url, result, screen) {
    this.url = url;
    this.result = result;
    this.screen = screen;
}

module.exports = testResult;