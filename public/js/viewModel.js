/// <reference path="../../typings/jquery/jquery.d.ts"/>
/// <reference path="../../typings/knockout/knockout.d.ts"/>
/// <reference path="../../typings/socket.io/socket.io.d.ts"/>
/// <reference path="../../typings/lodash/lodash.d.ts"/>
/// <reference path="../../typings/toastr/toastr.d.ts"/>
/// <reference path="../../typings/alertify/alertify.d.ts"/>
/// <reference path="types.ts"/>

var viewModel = (function () {
    function viewModel(settings, host) {
        var _this = this;
        this.settings = settings;
        this.stopScheduler = function () {
            $.ajax({
                type: 'post',
                url: _this.host() + '/api/stopSchedule'
            });
        };
        this.add = function () {
            if (_.findIndex(_this.urls(), function (item) {
                return item.url() == _this.newItem().url();
            }) == -1) {
                _this.urls.unshift(_this.newItem());
                _this.newItem(new SiteTesterTypes.SavePageModel(null));
                _this.pushSettingsToServer();
                return;
            }

            if (_this.count >= 1) {
                toastr.error("Url already in list");
                _this.count = -1;
            }
            viewModel.shakeForm();
            _this.count++;
        };
        this.addToCriticalErrors = function () {
            _.forEach(_this.choosenMetricsToAdd(), function (item) {
                _this.criticalErrors.push(item);
            });

            _this.pushSettingsToServer();
        };
        this.removeFromCriticalErrors = function (item) {
            _this.criticalErrors.remove(item);
            _this.pushSettingsToServer();
        };
        this.pushSettingsToServer = function () {
            _this.isLoading(true);
            var data = ko.toJSON({ settings: { 'urls': _this.urls(), 'cron': _this.cron(), 'criticalErrors': _this.criticalErrors() } });
            $.ajax({
                type: 'post',
                url: _this.host() + '/api/saveSettings',
                contentType: 'application/json',
                data: data,
                success: function (data) {
                    console.log(data);
                    if (data.toLowerCase() == 'ok') {
                        _this.isLoading(false);
                    }
                }
            });
        };
        this.runThis = function (data) {
            alert(data.foo);
        };
        this.availableHistoryNames = ko.observableArray([]);

        this.host = ko.observable('http://' + host);
        this.cron = ko.observable(settings.cron);
        this.newItem = ko.observable(new SiteTesterTypes.SavePageModel(null));
        this.histories = ko.observableArray([]);
        this.isRunning = ko.observable(false);
        this.selectedHistory = ko.observable('');
        this.currentData = ko.observable({});
        this.selectedMode = ko.observable('numbers');
        this.availableMetrics = ko.observableArray([]);
        this.selectedMetrics = ko.observableArray([]);
        this.scheduled = ko.observable(false);
        this.criticalErrors = ko.observableArray(settings.criticalErrors);
        this.currentDataByDomain = ko.observableArray([]);
        this.isLoading = ko.observable(true);
        this.selectedPage = ko.observable(null);
        this.searchBoxTerm = ko.observable('');
        this.copy = this.availableMetrics();
        this.currentPageData = ko.observable({ offenders: [], screen: '', url: { url: '' } });
        this.urls = ko.observableArray([]);
        this.choosenMetricsToAdd = ko.observableArray([]);
        this.fixedMetrics = ko.observableArray([
            "gzipRequests", "htmlCount", "cssCount", "jsCount", "imageCount", "otherCount", "cacheHits", "cachingNotSpecified", "cachingTooShort",
            "cachingDisabled", "oldCachingHeaders", "domainsWithCookies", "nodesWithInlineCSS", "imagesScaledDown", "imagesWithoutDimensions", "hiddenContentSize", "DOMqueriesById",
            "DOMqueriesByClassName", "DOMqueriesByTagName", "DOMqueriesByQuerySelectorAll", "DOMinserts", "DOMqueriesDuplicated", "domains", "eventsBound", "globalVariables",
            "globalVariablesFalsy", "headersBiggerThanContent", "localStorageEntries", "redirects", "assetsNotGzipped", "assetsWithQueryString", "assetsWithCookies",
            "smallImages", "timeToFirstCss", "timeToFirstJs", "timeToFirstImage", "smallestResponse", "biggestResponse", "fastestResponse", "slowestResponse",
            "smallestLatency", "biggestLatency", "webfontCount", "commentsSize", "postRequests", "httpsRequests", "ajaxRequests", "jsonCount",
            "notFound", "DOMidDuplicated", "jsErrors"]);

        var socket = io.connect(this.host());

        // Get the history names
        this.getHistoryNames();

        _.forEach(settings.urls, function (item) {
            if (_.findIndex(_this.urls(), function (nn) {
                return nn.url() == item;
            }) == -1) {
                _this.urls.push(new SiteTesterTypes.SavePageModel(item));
            }
        });

        this.count = 0;
        this.searchBoxTerm.subscribe(function () {
            if (_this.searchBoxTerm() != '') {
                _this.availableMetrics(_this.copy);
                var matches = _.filter(_this.availableMetrics(), function (item) {
                    return _.contains(item.toLowerCase(), _this.searchBoxTerm().toLowerCase());
                });
                _this.availableMetrics(matches);
            } else {
                _this.availableMetrics(_this.copy);
            }
        });

        this.selectedHistory.subscribe(function () {
            _this.isLoading(true);
            if (!_this.selectedHistory())
                return;

            _this.addToHistories(_this.selectedHistory());
            var data = { data: [] };

            _.forEach(_this.histories(), function (item) {
                if (item.getDate() == _this.selectedHistory()) {
                    data = { data: item.tests, date: item.testDate };

                    _.forEach(item.tests, function (val) {
                        var arr = _.map(val.offenders, function (v, i) {
                            return i;
                        });
                        ko.utils.arrayPushAll(_this.availableMetrics(), _.difference(arr, _this.availableMetrics()));
                    });
                }
            });

            _this.currentData(data);
            _this.isLoading(false);
        });

        this.selectedPage.subscribe(function (item) {
            console.log('Current page data changed');

            _this.currentPageData(_.find(_this.currentData().data, function (it) {
                return it.url == _this.selectedPage();
            }));
        });

        this.selectedMode.subscribe(function (mode) {
            if (mode == 'timeline') {
                // to make a timeline graph we need all run histories
                _.forEach($('#historiesPicker').find('option'), function (history) {
                    var h = $(history).val();
                    _this.addToHistories(h);
                });

                _this.selectedMetrics.subscribe(function () {
                    _this.makeTimelineGraph();
                });
            }

            if (mode == 'graph') {
                _this.selectedMetrics.subscribe(function () {
                    _this.makeGraph();
                });
            }
        });

        this.currentData.subscribe(function () {
            $('.loader').css('display', 'blick');
            var domains = [];
            var toAdd = [];

            _.forEach(_this.currentData().data, function (item) {
                var host = parseUri(item.getData().url).host;

                if (!_.contains(domains, host)) {
                    domains.push(host);
                    toAdd.push({ domain: host, tests: [item.getData()] });
                } else {
                    var indexOfItem = _.findIndex(toAdd, function (i) {
                        return i.domain == host;
                    });
                    toAdd[indexOfItem].tests.push(item.getData());
                }
            });

            _this.currentDataByDomain(toAdd);
        });

        this.isValid = ko.computed(function () {
            var pattern = /^(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            return pattern.test(_this.newItem().url());
        });

        this.canRun = ko.computed(function () {
            return !_this.isRunning() && _this.urls().length > 0;
        });

        socket.on('isRunning', function (data) {
            _this.isRunning(data.isRunning);
        });

        socket.on('SchedulerData', function (data) {
            _this.scheduled(data.data.isSet);
        });

        if ($('#cron').length)
            $('#cron').cron({
                initial: this.cron(),
                onChange: function () {
                    if (_this.cron() != $('#cron').cron('value')) {
                        _this.cron($('#cron').cron('value'));
                        _this.pushSettingsToServer();
                    }
                },
                useGentleSelect: true,
                customValues: {
                    '10 minutes': '*/10 * * * *'
                }
            });
    }
    viewModel.prototype.clearList = function () {
        this.urls.removeAll();
        this.pushSettingsToServer();
    };

    viewModel.prototype.getScreenshotPath = function () {
        return this.currentPageData().screen.length ? 'screens/' + this.currentPageData().screen : '';
    };
    viewModel.prototype.schedule = function () {
        $.ajax({
            type: 'post',
            data: ko.toJSON({ cron: this.cron() }),
            contentType: 'application/json',
            url: this.host() + '/api/schedule'
        });
    };

    viewModel.prototype.remove = function (item) {
        var index = _.findIndex(this.urls(), function (it) {
            return it.url == item.url;
        });
        this.urls().splice(index, 1);
        this.urls(this.urls());
        this.pushSettingsToServer();
    };

    viewModel.prototype.runNow = function () {
        $.ajax({
            type: 'post',
            url: this.host() + '/api/runNow'
        });
    };

    viewModel.prototype.deleteDb = function () {
        var _this = this;
        alertify.confirm('This is irreversible. Delete?', function (e) {
            if (e) {
                $.ajax({
                    type: 'post',
                    url: _this.host() + '/api/deleteDb',
                    success: function () {
                        _this.availableHistoryNames([]);
                    }
                });
            }
        });
    };

    viewModel.shakeForm = function () {
        var l = 20;
        for (var i = 0; i < 10; i++)
            $("#newPageModal").eq(0).animate({ 'margin-left': "+=" + (l = -l) + 'px' }, 30);
    };

    viewModel.prototype.addToHistories = function (name) {
        var _this = this;
        var data = ko.toJSON({ 'name': name.trim() });
        var exists = _.some(this.histories(), function (item) {
            return name == item.getDate();
        });

        if (!exists) {
            this.isLoading(true);

            $.ajax({
                type: 'post',
                async: false,
                contentType: 'application/json',
                dataType: 'json',
                url: this.host() + '/api/GetHistoryByName',
                data: data,
                success: function (result, status) {
                    var toAdd = [];
                    result = JSON.parse(result).data;

                    _.forEach(result, function (test) {
                        if (test) {
                            var data = JSON.parse(test.result);
                            var offenders = data.offenders || {};
                            var metrics = data.metrics || {};

                            toAdd.push(new SiteTesterTypes.TestInstance(offenders, metrics, test.url, test.screen.split('/').pop()));
                        }
                    });

                    console.log('Adding to histories..');
                    _this.histories.push(new SiteTesterTypes.TestHistory(name, toAdd));
                    _this.isLoading(false);
                }
            });
        } else {
            console.log('Skipping, already in list..');
        }
    };

    viewModel.prototype.makeTimelineGraph = function () {
        var _this = this;
        this.isLoading(true);
        var graphWidth = 0;

        _.forEach(this.currentData().data, function (current) {
            if (current.getData().url == getSelectedPage()) {
                var cssClass = '.graph';
                var divId = 'graph-wrapper1timeline';
                var divSelector = '#' + divId;
                var containerDiv = "<div class='col-md-10 no-margin' id='" + divId + "'></div>";
                var docSelector = '#graph-wrapper';

                // append the div to DOM and set visibility
                if (!$(divSelector).length) {
                    $(docSelector).find(cssClass).append(containerDiv);
                    $(divSelector).attr('data-bind', "visible: selectedMode() == 'timeline'");
                    $(divSelector).append("<div class='graphContainer' style='height: 600px; margin-left: 40px;'></div>");
                }

                // update the width of the graph
                graphWidth = $(divSelector).find('.graphContainer').width() > graphWidth ? $(divSelector).find('.graphContainer').width() : graphWidth;

                var graphDates = [];
                var seriesData = [];
                var metricData;

                _.forEach(_this.histories(), function (history) {
                    graphDates.push(history.getDate());

                    _.forEach(history.getTests(), function (item) {
                        if (item.getData().url == current.getData().url) {
                            _.forEach(_this.selectedMetrics(), function (metric) {
                                var temp = item.getData().offenders[metric];
                                metricData = temp ? temp.length : 0;

                                var myIndex = _.findIndex(seriesData, function (e) {
                                    return e.name == metric;
                                });
                                if (myIndex != -1) {
                                    seriesData[myIndex].data.push(metricData);
                                } else {
                                    seriesData.push({ name: metric, data: [metricData] });
                                }
                            });
                        }
                    });
                });

                $(divSelector).find('.graphContainer').highcharts({
                    title: {
                        text: current.getData().url
                    },
                    chart: {
                        width: graphWidth
                    },
                    xAxis: {
                        categories: graphDates
                    },
                    yAxis: {
                        title: {
                            text: 'metrics'
                        }
                    },
                    series: seriesData
                });

                updateKOBindings(divSelector);
            }
        });

        this.isLoading(false);
    };

    viewModel.prototype.makeGraph = function () {
        var _this = this;
        this.isLoading(true);
        _.forEach(this.currentData().data, function (testInstance) {
            if (testInstance.getData().url == getSelectedPage()) {
                var cssClass = '.graph';
                var divId = 'graph-wrapper1';
                var divSelector = '#' + divId;
                var containerDiv = "<div class='col-md-10 no-margin' id='" + divId + "'></div>";
                var docSelector = $('#graph-wrapper');

                if (!$(divSelector).length) {
                    $(docSelector).find(cssClass).append(containerDiv);
                    $(divSelector).attr('data-bind', "visible: selectedMode() == 'graph'");
                    $(divSelector).append("<div class='graphContainer' style='height: 600px; margin-left: 40px;'></div>");
                }

                var metrics = [];
                var data = [];
                var metricData;

                _.forEach(_this.selectedMetrics(), function (metric) {
                    var temp = testInstance.getData().offenders[metric];
                    metricData = temp ? temp.length : 0;

                    var myIndex = _.findIndex(data, function (e) {
                        return e.name == metric;
                    });
                    if (myIndex != -1) {
                        data[myIndex].data.push(metricData);
                    } else {
                        data.push({ name: metric, data: [metricData] });
                    }
                });

                $(divSelector).find('.graphContainer').highcharts({
                    title: {
                        text: testInstance.getData().url
                    },
                    chart: {
                        width: 1112,
                        type: 'column'
                    },
                    xAxis: {
                        categories: metrics
                    },
                    yAxis: {
                        title: {
                            text: 'count'
                        }
                    },
                    series: data
                });

                updateKOBindings(divSelector);
            }
        });

        this.isLoading(false);
    };

    viewModel.prototype.getHistoryNames = function () {
        var _this = this;
        this.isLoading(true);
        $.ajax({
            type: 'post',
            url: this.host() + '/api/getHistoryNames',
            success: function (data) {
                _this.availableHistoryNames(JSON.parse(data));
            }
        });

        this.isLoading(false);
    };

    viewModel.prototype.deleteHistoryByName = function (name) {
        var _this = this;
        console.log('Deleting.. ' + name);

        $.ajax({
            type: 'post',
            contentType: 'application/json',
            url: this.host() + '/api/deleteHistoryByName',
            data: ko.toJSON({ name: name }),
            success: function () {
                _this.availableHistoryNames.remove(name);
            }
        });
    };

    viewModel.getValidDivId = function (url, cssClass, type) {
        return url.replace(/\//g, '').replace(/\./g, '').replace(/\:/g, '') + cssClass.split('.')[1] + type;
    };

    viewModel.prototype.makeValidIdFromUrl = function (url, index) {
        return url.replace(/\//g, '').replace(/\./g, '').replace(/\:/g, '');
    };
    return viewModel;
})();
//# sourceMappingURL=viewModel.js.map
