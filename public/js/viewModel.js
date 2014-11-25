/// <reference path="../../typings/jquery/jquery.d.ts"/>
/// <reference path="../../typings/knockout/knockout.d.ts"/>
/// <reference path="../../typings/socket.io/socket.io.d.ts"/>
/// <reference path="../../typings/lodash/lodash.d.ts"/>
/// <reference path="../../typings/toastr/toastr.d.ts"/>
/// <reference path="types.ts"/>
var viewModel = (function () {
    function viewModel(settings, host) {
        var _this = this;
        this.settings = settings;
        this.host = ko.observable('http://' + host);
        this.cron = ko.observable(settings.cron);
        this.screenshot = ko.observable(settings.screenshot);
        this.newItem = ko.observable('http://');
        this.urls = ko.observableArray(settings.urls);
        this.histories = ko.observableArray([]);
        this.isRunning = ko.observable(false);

        this.selectedHistory = ko.observable('');
        this.currentData = ko.observable({});
        this.selectedMode = ko.observable('numbers');

        var socket = io.connect(this.host());

        this.count = 0;

        this.selectedHistory.subscribe(function () {
            var exists = false;

            _.forEach(_this.histories(), function (item) {
                if (item.getDate() == _this.selectedHistory()) {
                    exists = true;
                }
            });

            if (!exists) {
                _this.addToHistories(_this.selectedHistory());
            } else {
                console.log('Skipping, already in list.');
            }

            var data = {};

            _.forEach(_this.histories(), function (item) {
                if (item.getDate() == _this.selectedHistory()) {
                    data = { data: item.tests, date: item.testDate };
                }
            });

            _this.currentData(data);
        });

        this.isValid = ko.computed(function () {
            var pattern = /^(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            return pattern.test(_this.newItem());
        });

        this.canRun = ko.computed(function () {
            return !_this.isRunning() && _this.urls().length > 0;
        });

        socket.on('isRunning', function (data) {
            _this.isRunning(data.isRunning);
        });

        if ($('#cron').length)
            $('#cron').cron({
                initial: this.cron(),
                onChange: function () {
                    _this.cron($('#cron').cron('value'));
                    _this.pushSettingsToServer();
                },
                useGentleSelect: true
            });
    }
    viewModel.prototype.add = function () {
        if (!_.contains(this.urls(), this.newItem())) {
            this.urls.unshift(this.newItem());
            this.newItem('http://');
            this.pushSettingsToServer();
            return;
        }

        if (this.count >= 1) {
            toastr.error("Url already in list");
            this.count = -1;
        }
        this.shakeForm();
        this.count++;
    };

    viewModel.prototype.remove = function (item) {
        this.urls.remove(item);
        this.pushSettingsToServer();
    };

    viewModel.prototype.runNow = function () {
        $.ajax({
            type: 'post',
            url: this.host() + '/runNow'
        });
    };

    viewModel.prototype.deleteDb = function () {
        if (confirm('Are you sure ?')) {
            $.ajax({
                type: 'post',
                url: this.host() + '/deleteDb'
            });
        }
    };

    viewModel.prototype.shakeForm = function () {
        var l = 20;
        for (var i = 0; i < 10; i++)
            $("form > div > input").eq(0).animate({ 'margin-left': "+=" + (l = -l) + 'px' }, 30);
    };

    viewModel.prototype.pushSettingsToServer = function () {
        var data = ko.toJSON({ settings: { 'urls': this.urls(), 'screenshot': this.screenshot(), 'cron': this.cron() } });
        console.log(this.screenshot());
        $.ajax({
            type: 'post',
            url: this.host() + '/saveSettings',
            contentType: 'application/json',
            data: data
        });
    };

    viewModel.prototype.addToHistories = function (name) {
        var _this = this;
        var data = ko.toJSON({ 'name': name });

        $.ajax({
            type: 'post',
            async: false,
            contentType: 'application/json',
            dataType: 'json',
            url: this.host() + '/api/GetHistoryByName',
            data: data,
            success: function (result, status) {
                var toAdd = [];

                _.forEach(result[_this.selectedHistory()], function (test) {
                    if (test.result) {
                        var offenders = test.result.offenders || {};
                        var metrics = test.result.metrics || {};

                        toAdd.push(new TestInstance(offenders, metrics, test.url));
                    }
                });

                console.log('Adding to histories..');

                _this.histories.push(new TestHistory(_this.selectedHistory(), toAdd));
            }
        });
    };
    return viewModel;
})();

var TestHistory = (function () {
    function TestHistory(date, tests) {
        this.testDate = date;
        this.tests = tests;
    }
    TestHistory.prototype.getDate = function () {
        return this.testDate;
    };
    return TestHistory;
})();

var TestInstance = (function () {
    function TestInstance(offenders, metrics, url) {
        this.offenders = offenders;
        this.metrics = metrics;
        this.url = url;
    }
    return TestInstance;
})();
//# sourceMappingURL=viewModel.js.map
