var phantomas = require('phantomas');



function TestEngine(url, options) {

    this.url = url;
}


TestEngine.prototype.run = function run(callback) {

     phantomas(this.url, function(a,b,c) {
        callback(b);
    })
};

module.exports = TestEngine;