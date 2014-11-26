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
            _this.addToHistories(_this.selectedHistory());
            var data = {};

            _.forEach(_this.histories(), function (item) {
                if (item.getDate() == _this.selectedHistory()) {
                    data = { data: item.tests, date: item.testDate };
                }
            });

            _this.currentData(data);
        });

        this.selectedMode.subscribe(function (mode) {
            if (mode == 'timeline') {
                // to make a timeline graph we need all run histories
                _.forEach($('#historiesPicker').find('option'), function (history) {
                    var h = $(history).val();
                    console.log("to h einai: " + h);
                    _this.addToHistories(h);
                });

                _this.makeTimelineGraph(new SiteTesterTypes.MetricData(0 /* javascript_Error */));
            }
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
        viewModel.shakeForm();
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

    viewModel.shakeForm = function () {
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
        var data = ko.toJSON({ 'name': name.trim() });
        var exists = _.some(this.histories(), function (item) {
            return name == item.getDate();
        });

        if (!exists) {
            $.ajax({
                type: 'post',
                async: false,
                contentType: 'application/json',
                dataType: 'json',
                url: this.host() + '/api/GetHistoryByName',
                data: data,
                success: function (result, status) {
                    var toAdd = [];

                    _.forEach(result[name], function (test) {
                        if (test.result) {
                            var offenders = test.result.offenders || {};
                            var metrics = test.result.metrics || {};

                            toAdd.push(new SiteTesterTypes.TestInstance(offenders, metrics, test.url));
                        }
                    });

                    console.log('Adding to histories..');
                    _this.histories.push(new SiteTesterTypes.TestHistory(name, toAdd));
                }
            });
        } else {
            console.log('Skipping, already in list..');
        }
    };

    viewModel.prototype.makeTimelineGraph = function (metricType) {
        var _this = this;
        _.forEach(this.currentData().data, function (current) {
            var divId = viewModel.getValidDivId(current.getData().url, metricType.getCssClass());
            var containerDiv = "<div id='" + divId + "'></div>";
            var docSelector = "*[data-url='" + current.getData().url + "']";

            // append the div to DOM and set visibility
            var divSelector = '#' + divId;

            if (!$(divSelector).length) {
                $(docSelector).find(metricType.getCssClass()).append(containerDiv);
                $(divSelector).attr('data-bind', "visible: selectedMode() == 'timeline'");

                $(divSelector).append("<div class='graphContainer' style='width: 100%; height: 400px;'></div>");

                var data = { dates: [], url: current.getData().url, data: { name: metricType, count: [] } };

                _.forEach(_this.histories(), function (history) {
                    //var k = _.filter(history.getTests(), (item : SiteTesterTypes.TestInstance)  => {
                    //    console.log("to current " + current.getData().url)
                    //    console.log("to history " + item.getData().url)
                    //    return item.getData().url == current.getData().url
                    //});
                    var k;
                    _.forEach(history.getTests(), function (item) {
                        if (item.getData().url == current.getData().url) {
                            console.log("gotcha");
                            k = item;
                        }
                    });

                    data.dates.push(history.getDate());

                    if (k) {
                        data.data.count.push(k.getData().offenders.jsErrors.length);
                    }
                });

                console.log(data.dates);
                console.log(data.data.count);

                $(divSelector).find('.graphContainer').highcharts({
                    title: {
                        text: 'Javascript errors'
                    },
                    xAxis: {
                        categories: ['simera', 'aurio', 'pio meta']
                    },
                    yAxis: {
                        title: {
                            text: 'jsErrors'
                        }
                    },
                    series: [{
                            name: current.getData().url,
                            data: data.data.count
                        }]
                });

                updateKOBindings(divSelector);
            }
        });
    };

    viewModel.getValidDivId = function (url, cssClass) {
        return url.split('//')[1].split('.')[0] + cssClass.split('.')[1];
    };
    return viewModel;
})();
//# sourceMappingURL=viewModel.js.map
