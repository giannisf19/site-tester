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

        var socket = io.connect(this.host());

        this.count = 0;

        this.selectedHistory.subscribe(function () {
            console.log('sdf');
            var result = _this.getHistoryByName(_this.selectedHistory());

            console.log(result);

            _this.getHistoryByName(_this.selectedHistory());
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

    viewModel.prototype.fetchHistoryByName = function (name) {
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

    viewModel.prototype.getHistoryByName = function (name) {
        var history = {};
        var data = ko.toJSON({ 'name': name });

        $.ajax({
            type: 'post',
            contentType: 'application/json',
            dataTyoe: 'json',
            url: this.host() + '/api/GetHistoryByName',
            data: data,
            success: function (data, status) {
                return data;
            }
        });
    };
    return viewModel;
})();
;

var TestHistory = (function () {
    function TestHistory() {
        this.testDate = ko.observable('');
        this.tests = ko.observable();
    }
    return TestHistory;
})();
;

var TestInstance = (function () {
    function TestInstance() {
        this.offenders = ko.observableArray([]);
    }
    return TestInstance;
})();
;
//# sourceMappingURL=viewModel.js.map
