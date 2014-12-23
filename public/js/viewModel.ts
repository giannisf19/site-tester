/// <reference path="../../typings/jquery/jquery.d.ts"/>
/// <reference path="../../typings/knockout/knockout.d.ts"/>
/// <reference path="../../typings/socket.io/socket.io.d.ts"/>
/// <reference path="../../typings/lodash/lodash.d.ts"/>
/// <reference path="../../typings/toastr/toastr.d.ts"/>
/// <reference path="../../typings/alertify/alertify.d.ts"/>
/// <reference path="types.ts"/>


declare var io: any;
declare var updateKOBindings : any ;
declare var parseUri : any;
declare var getSelectedPage : any;

interface JQuery  {
    cron : any;
    highcharts : any;
    accordion : any;
}

interface Window {
    getSelectedPage : any;
}

class viewModel {

    private host : KnockoutObservable<string>;
    private cron: KnockoutObservable<string>;
    private newItem : KnockoutObservable<SiteTesterTypes.SavePageModel>;
    private screenshot: KnockoutObservable<boolean>;
    private urls: KnockoutObservableArray<SiteTesterTypes.SavePageModel>;
    private isRunning : KnockoutObservable<boolean>;
    private histories: KnockoutObservableArray<any>;
    private selectedHistory : KnockoutObservable<string>;
    private isValid : KnockoutComputed<boolean>;
    private canRun : KnockoutComputed<boolean>;
    private count: number;
    private currentData : KnockoutObservable<any>;
    private selectedMode : KnockoutObservable<string>;
    private availableMetrics : KnockoutObservableArray<string>;
    private selectedMetrics : KnockoutObservableArray<string>;
    private scheduled: KnockoutObservable<boolean>;
    private availableHistoryNames : KnockoutObservableArray<string>;
    private currentDataByDomain : KnockoutObservableArray<any>;
    private criticalErrors : KnockoutObservableArray<string>;
    private selectedPage : KnockoutObservable<string>;
    private currentPageData : KnockoutObservable<any>;
    private searchBoxTerm : KnockoutObservable<string>;
    private copy : Array<string>;
    private isLoading : KnockoutObservable<boolean>;

    constructor(private settings : SiteTesterTypes.SiteTesterSettings,  host : string) {

        this.availableHistoryNames  = ko.observableArray([]);

        this.host = ko.observable('http://' + host);
        this.cron  = ko.observable(settings.cron);
        this.newItem  = ko.observable(new SiteTesterTypes.SavePageModel(null));
        this.histories = ko.observableArray([]);
        this.isRunning = ko.observable(false);
        this.selectedHistory = ko.observable('');
        this.currentData = ko.observable({});
        this.selectedMode = ko.observable('numbers');
        this.availableMetrics  = ko.observableArray([]);$
        this.selectedMetrics = ko.observableArray([]);
        this.scheduled = ko.observable(false);
        this.criticalErrors = ko.observableArray(['jsErrors', 'notFound']);
        this.currentDataByDomain = ko.observableArray([]);
        this.isLoading = ko.observable(true);
        this.selectedPage = ko.observable(null);
        this.searchBoxTerm = ko.observable('');
        this.copy = this.availableMetrics();
        this.currentPageData = ko.observable({offenders: [], screen: '', url: {url: ''}});
        this.urls = ko.observableArray([]);

        var socket = io.connect(this.host());


        // Get the history names
        this.getHistoryNames();



        _.forEach(settings.urls, (item : string)=>{

            if (_.findIndex(this.urls(), (nn) => {return nn.url() == item}) == -1) {
                this.urls.push(new SiteTesterTypes.SavePageModel(item))
            }
        });




        this.count = 0;
        this.searchBoxTerm.subscribe(() => {

            if (this.searchBoxTerm() != '') {
                this.availableMetrics(this.copy);
                var matches = _.filter(this.availableMetrics(), (item) => {return _.contains(item.toLowerCase(), this.searchBoxTerm().toLowerCase()) });
                this.availableMetrics(matches);
            }

            else {
                this.availableMetrics(this.copy);
            }

        });







        this.selectedHistory.subscribe(() => {

            this.isLoading(true);
            if (!this.selectedHistory()) return;

                this.addToHistories(this.selectedHistory());
                var data = {data: []};

                _.forEach(this.histories(), (item)=> {
                    if (item.getDate() == this.selectedHistory()) {
                        data = {data: item.tests, date: item.testDate};

                        _.forEach(item.tests, (val : any) => {
                            var arr  = _.map(val.offenders, (v,i) => {return i});
                            ko.utils.arrayPushAll(this.availableMetrics(), _.difference(arr, this.availableMetrics()));

                        });

                    }
                });

                this.currentData(data);
                this.isLoading(false);
        });


        this.selectedPage.subscribe((item) => {
            this.currentPageData(_.find(this.currentData().data, (it : any) => {return it.url.url == this.selectedPage()}))
        });

        this.selectedMode.subscribe((mode) => {
            if (mode == 'timeline') {

                // to make a timeline graph we need all run histories

                _.forEach($('#historiesPicker').find('option'), (history) => {
                   var h = $(history).val();
                    this.addToHistories(h);
                });



                this.selectedMetrics.subscribe(() => {
                    this.makeTimelineGraph();
                });

            }

            if (mode == 'graph') {
                this.selectedMetrics.subscribe(() => {
                    this.makeGraph();
                });
            }
        });

        this.currentData.subscribe(() =>{

            this.isLoading(true);

           var domains = [];
           var toAdd : SiteTesterTypes.DomainWithTests[] = [];

           _.forEach(this.currentData().data, (item : SiteTesterTypes.TestInstance) => {

               var host = parseUri(item.getData().url.url).host;

                if (! _.contains(domains, host))  {
                    domains.push(host);
                    toAdd.push({domain : host, tests: [item.getData()]})
                }

                else {
                   var indexOfItem = _.findIndex(toAdd, (i) =>  {return i.domain == host});
                    toAdd[indexOfItem].tests.push(item.getData());
                }
           });

           this.currentDataByDomain(toAdd);
           this.isLoading(false);
        });


        this.isValid = ko.computed(() => {

            var pattern = /^(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            return pattern.test(this.newItem().url());
        });


        this.canRun = ko.computed(() => {
            return !this.isRunning() && this.urls().length > 0
        });



        socket.on('isRunning',  (data) => {
            this.isRunning(data.isRunning);

        });


        socket.on('SchedulerData', (data) => {
            this.scheduled(data.data.isSet);
        });


        if ($('#cron').length)
            $('#cron').cron({
                initial: this.cron(),
                onChange:  () =>{
                    if (this.cron() != $('#cron').cron('value')) {
                        this.cron($('#cron').cron('value'));
                        this.pushSettingsToServer();
                    }
                },
                useGentleSelect: true,
                customValues: {
                    '10 minutes': '*/10 * * * *'
                }


            });
    }




    clearList() {
        this.urls.removeAll();
        this.pushSettingsToServer();
    }


    getScreenshotPath() {
        return this.currentPageData().screen.length ? 'screens/' + this.currentPageData().screen : ''
    }
   schedule() {
       $.ajax({
           type: 'post',
           data: ko.toJSON({cron:this.cron()}),
           contentType: 'application/json',
           url: this.host() + '/api/schedule'
       });
   }

    stopScheduler = () => {
        $.ajax({
            type: 'post',
            url: this.host() + '/api/stopSchedule'
        });
    };

    add = () =>  {

        if ( _.findIndex(this.urls(), (item : SiteTesterTypes.SavePageModel) => {return item.url() == this.newItem().url()}) == -1) {

            this.urls.unshift(this.newItem());
            this.newItem(new SiteTesterTypes.SavePageModel(null));
            this.pushSettingsToServer();
            return;
        }

        if (this.count >= 1) {toastr.error("Url already in list"); this.count =-1}
        viewModel.shakeForm();
        this.count++

    };

    remove(item) {

        var index = _.findIndex(this.urls(), (it) => {return it.url == item.url});
        this.urls().splice(index, 1);
        this.urls(this.urls());
        this.pushSettingsToServer();

    }


    runNow() {
        $.ajax({
            type: 'post',
            url: this.host() + '/api/runNow'
        });
    }

    deleteDb()  {
       alertify.confirm('This is irreversible. Delete?', (e) =>{
          if (e) {
              $.ajax({
                  type: 'post',
                  url: this.host() + '/api/deleteDb',
                  success: ()=> {
                      this.availableHistoryNames([]);
                  }
              });
          }
       })
    }


     static shakeForm() {
        var l = 20;
        for( var i = 0; i < 10; i++ )
            $( "#newPageModal").eq(0).animate( { 'margin-left': "+=" + ( l = -l ) + 'px' }, 30);
    }


     pushSettingsToServer = () => {

        var data = ko.toJSON({settings :{'urls' : this.urls(), 'cron' : this.cron()}}) ;
        $.ajax({
            type: 'post',
            url: this.host() + '/api/saveSettings',
            contentType: 'application/json',
            data: data

        });
     };

    addToHistories(name: string) {
        var data = ko.toJSON({ 'name': name.trim() });
        var exists = _.some(this.histories(), (item : SiteTesterTypes.TestHistory) => {return name == item.getDate()});

        if ( !exists) {

            this.isLoading(true);

            $.ajax({
                type: 'post',
                async: false,
                contentType: 'application/json',
                dataType: 'json',
                url: this.host() + '/api/GetHistoryByName',
                data: data,
                success: (result, status) => {

                    var toAdd : SiteTesterTypes.TestInstance[] = [];

                    _.forEach(result[name], (test : any) => {
                        if (test.result)
                        {
                            var offenders = test.result.offenders || {};
                            var metrics = test.result.metrics || {};

                            toAdd.push(new SiteTesterTypes.TestInstance(offenders, metrics, test.url, test.screen.split('/').pop()));
                        }

                    });

                    console.log('Adding to histories..');
                    this.histories.push(new SiteTesterTypes.TestHistory(name, toAdd))
                    this.isLoading(false);
                }

            });

        }

        else {
            console.log('Skipping, already in list..')
        }

    }

    makeTimelineGraph() {

        this.isLoading(true);
        var graphWidth = 0;

        _.forEach(this.currentData().data, (current : SiteTesterTypes.TestInstance)=> {


            if (current.getData().url.url == getSelectedPage()) {

                var cssClass = '.graph';
                var divId = 'graph-wrapper1timeline'//viewModel.getValidDivId(current.getData().url, cssClass, 'timeline');
                var divSelector = '#' + divId;
                var containerDiv = "<div class='col-md-10 no-margin' id='" + divId + "'></div>";
                var docSelector = '#graph-wrapper' ;//"*[data-url='" + current.getData().url + "']";


                // append the div to DOM and set visibility

                if (!$(divSelector).length) { // prepare the DOM for the graph
                    $(docSelector).find(cssClass).append(containerDiv);
                    $(divSelector).attr('data-bind', "visible: selectedMode() == 'timeline'");
                    $(divSelector).append("<div class='graphContainer' style='height: 600px; margin-left: 40px;'></div>");

                }

                // update the width of the graph
                graphWidth = $(divSelector).find('.graphContainer').width() > graphWidth ? $(divSelector).find('.graphContainer').width() : graphWidth;


                var graphDates = [];
                var seriesData = [];
                var metricData;

                _.forEach(this.histories(), (history:SiteTesterTypes.TestHistory) => {


                    graphDates.push(history.getDate());

                    _.forEach(history.getTests(), (item) => {
                        if (item.getData().url.url == current.getData().url.url) { // Is this the current url ?

                            _.forEach(this.selectedMetrics(), (metric) => { // Collect data for selected metrics

                                var temp = item.getData().offenders[metric];
                                metricData = temp ? temp.length : 0;

                                var myIndex = _.findIndex(seriesData, (e) => {
                                    return e.name == metric
                                });
                                if (myIndex != -1) {

                                    seriesData[myIndex].data.push(metricData);
                                }

                                else {

                                    seriesData.push({name: metric, data: [metricData]})
                                }
                            });

                        }
                    });


                });


                $(divSelector).find('.graphContainer').highcharts({

                    title: {
                        text: current.getData().url.url
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

    }

    makeGraph()  {

        this.isLoading(true);
        _.forEach(this.currentData().data, (testInstance : SiteTesterTypes.TestInstance) => {

            if (testInstance.getData().url.url == getSelectedPage()) {


                var cssClass = '.graph';
                var divId = 'graph-wrapper1'//viewModel.getValidDivId(testInstance.getData().url, cssClass, 'normal');
                var divSelector = '#' + divId;
                var containerDiv = "<div class='col-md-10 no-margin' id='" + divId + "'></div>";
                var docSelector = $('#graph-wrapper')//"*[data-url='" + testInstance.getData().url + "']";


                if (!$(divSelector).length) { // prepare the DOM for the graph

                    $(docSelector).find(cssClass).append(containerDiv);
                    $(divSelector).attr('data-bind', "visible: selectedMode() == 'graph'");
                    $(divSelector).append("<div class='graphContainer' style='height: 600px; margin-left: 40px;'></div>");

                }


                var metrics = [];
                var data = [];
                var metricData;

                _.forEach(this.selectedMetrics(), (metric) => {


                    var temp = testInstance.getData().offenders[metric];
                    metricData = temp ? temp.length : 0;

                    var myIndex = _.findIndex(data, (e) => {
                        return e.name == metric
                    });
                    if (myIndex != -1) {

                        data[myIndex].data.push(metricData);
                    }

                    else {

                        data.push({name: metric, data: [metricData]})
                    }

                });

                $(divSelector).find('.graphContainer').highcharts({

                    title: {
                        text: testInstance.getData().url.url
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

}

    getHistoryNames() {

        this.isLoading(true);
      $.ajax({
          type: 'post',
          url: this.host() + '/api/getHistoryNames',
          success: (data)=> {
               this.availableHistoryNames(JSON.parse(data));
          }

      });

        this.isLoading(false);
    }


    deleteHistoryByName(name) {

        console.log('Deleting.. ' +  name);

        $.ajax({
            type: 'post',
            contentType: 'application/json',
            url: this.host() + '/api/deleteHistoryByName',
            data: ko.toJSON({name: name}),
            success: () =>{
                this.availableHistoryNames.remove(name);
        }
        })

    }


    runThis = function(data){
        alert(data.foo);
    };

    static getValidDivId(url : string, cssClass : string, type  :string) {
        return url.replace(/\//g, '').replace(/\./g, '').replace(/\:/g, '') + cssClass.split('.')[1] + type;
    }

    makeValidIdFromUrl(url, index) {

        return url.replace(/\//g, '').replace(/\./g, '').replace(/\:/g, '');

    }



}
