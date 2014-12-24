'use strict';

module.exports = function(sequelize, DataTypes) {
    var Result = sequelize.define("Result", {
        date: DataTypes.STRING,
        url: DataTypes.STRING,
        testResult: DataTypes.STRING(Number.MAX_VALUE),
        screen: DataTypes.STRING
    }, {
        classMethods: {

        }
    });

    return Result;
};