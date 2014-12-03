var SiteTesterTypes;
(function (SiteTesterTypes) {
    (function (MetricType) {
        MetricType[MetricType["javascript_Error"] = 0] = "javascript_Error";
        MetricType[MetricType["not_found"] = 1] = "not_found";
    })(SiteTesterTypes.MetricType || (SiteTesterTypes.MetricType = {}));
    var MetricType = SiteTesterTypes.MetricType;

    var MetricData = (function () {
        function MetricData(type) {
            this.type = type;
        }
        MetricData.prototype.getCssClass = function () {
            return (this.type == 0 /* javascript_Error */ ? '.jserror' : (this.type == 1 /* not_found */) ? '.notfound' : '');
        };
        return MetricData;
    })();
    SiteTesterTypes.MetricData = MetricData;

    var TestHistory = (function () {
        function TestHistory(date, tests) {
            this.testDate = date;
            this.tests = tests;
        }
        TestHistory.prototype.getDate = function () {
            return this.testDate;
        };

        TestHistory.prototype.getTests = function () {
            return this.tests;
        };
        return TestHistory;
    })();
    SiteTesterTypes.TestHistory = TestHistory;

    var TestInstance = (function () {
        function TestInstance(offenders, metrics, url, screen) {
            this.offenders = offenders;
            this.metrics = metrics;
            this.url = url;
            this.screen = screen;
        }
        TestInstance.prototype.getData = function () {
            return { url: this.url, metrics: this.metrics, offenders: this.offenders };
        };
        return TestInstance;
    })();
    SiteTesterTypes.TestInstance = TestInstance;
})(SiteTesterTypes || (SiteTesterTypes = {}));
//# sourceMappingURL=types.js.map
