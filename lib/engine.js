var phantomas = require('phantomas');


var running = false;

function TestEngine(url, options) {

    this.url = url;
}


TestEngine.prototype.run = function run(callback) {
    running = true;
     phantomas(this.url, function(a,b,c) {
        running = false;
        callback(b);
    })
};


module.exports.Running = running;
module.exports = TestEngine;