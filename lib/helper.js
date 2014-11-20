/**
 * Created by gfoulidis on 20/11/2014.
 */
var fs = require('fs');

module.exports.Init = function Init() {

    if (! fs.existsSync('./db')) fs.mkdirSync('./db');

    if (! fs.existsSync('./db/db.json')) {
        fs.writeFileSync('./db/db.json', JSON.stringify({history: [], settings: {
            urls: [],
            screenshot: ''
        }}));
    }



};