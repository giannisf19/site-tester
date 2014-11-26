/// <reference path="../../typings/jquery/jquery.d.ts"/>
/// <reference path="../../typings/knockout/knockout.d.ts"/>
/// <reference path="../../typings/socket.io/socket.io.d.ts"/>
/// <reference path="../../typings/lodash/lodash.d.ts"/>
/// <reference path="../../typings/toastr/toastr.d.ts"/>
/// <reference path="types.ts"/>


declare var io: any;
declare var updateKOBindings : any ;

interface JQuery  {
    cron : any;
    highcharts : any;
}




class viewModel {

    private host : KnockoutObservable<string>;
    private cron: KnockoutObservable<string>;
    private newItem : KnockoutObservable<string>;
    private screenshot: KnockoutObservable<boolean>;
    private urls: KnockoutObservableArray<string>;
    private isRunning : KnockoutObservable<boolean>;
    private histories: KnockoutObservableArray<any>;
    private selectedHistory : KnockoutObservable<string>;
    private isValid : KnockoutComputed<boolean>;
    private canRun : KnockoutComputed<boolean>;
    private socket : SocketIO.Socket;
    private count: number;
    private currentData : KnockoutObservable<any>;
    private selectedMode : KnockoutObservable<string>;



    constructor(private settings : SiteTesterTypes.SiteTesterSettings,  host : string) {
        
    	
        this.host = ko.observable('http://' + host);
        this.cron  = ko.observable(settings.cron);
        this.screenshot = ko.observable(settings.screenshot);
        this.newItem  = ko.observable('http://');
        this.urls = ko.observableArray(settings.urls);
        this.histories = ko.observableArray([]);
        this.isRunning = ko.observable(false);
        this.selectedHistory = ko.observable('');
        this.currentData = ko.observable({});
        this.selectedMode = ko.observable('numbers');

        var socket = io.connect(this.host());
        

        this.count = 0;

        this.selectedHistory.subscribe(() => {

                this.addToHistories(this.selectedHistory());
                var data = {};

                _.forEach(this.histories(), (item)=> {
                    if (item.getDate() == this.selectedHistory()) {
                        data = {data: item.tests, date: item.testDate}
                    }
                });

                this.currentData(data);


        });

        this.selectedMode.subscribe((mode) => {
            if (mode == 'timeline') {


                // to make a timeline graph we need all run histories

                _.forEach($('#historiesPicker').find('option'), (history) => {
                   var h = $(history).val();

                    this.addToHistories(h);
                });


                this.makeTimelineGraph(new SiteTesterTypes.MetricData(SiteTesterTypes.MetricType.javascript_Error))
            }
        });

        this.isValid = ko.computed(() => {
            var pattern = /^(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            return pattern.test(this.newItem());
        });


        this.canRun = ko.computed(() => {
            return !this.isRunning() && this.urls().length > 0
        });



        socket.on('isRunning',  (data) => {
            this.isRunning(data.isRunning);
        });



        if ($('#cron').length)
            $('#cron').cron({
                initial: this.cron(),
                onChange:  () =>{
                    this.cron($('#cron').cron('value'));
                    this.pushSettingsToServer();

                },
                useGentleSelect: true
            });

    }


    add()  {
        if (! _.contains(this.urls(), this.newItem())) {
            this.urls.unshift(this.newItem());
            this.newItem('http://');
            this.pushSettingsToServer();
            return;
        }

        if (this.count >= 1) {toastr.error("Url already in list"); this.count =-1}
        viewModel.shakeForm();
        this.count++

    }

    remove(item) {
        this.urls.remove(item);
        this.pushSettingsToServer();

    }


    runNow() {
        $.ajax({
            type: 'post',
            url: this.host() + '/runNow'
        });
    }

    deleteDb()  {
        if (confirm('Are you sure ?')) {
            $.ajax({
                type: 'post',
                url: this.host() + '/deleteDb'
            });
        }

    }


     static shakeForm() {
        var l = 20;
        for( var i = 0; i < 10; i++ )
            $( "form > div > input").eq(0).animate( { 'margin-left': "+=" + ( l = -l ) + 'px' }, 30);
    }


     pushSettingsToServer() {

        var data = ko.toJSON({settings :{'urls' : this.urls(), 'screenshot' : this.screenshot(), 'cron' : this.cron()}}) ;
        console.log(this.screenshot());
        $.ajax({
            type: 'post',
            url: this.host() + '/saveSettings',
            contentType: 'application/json',
            data: data

        });
     }


    addToHistories(name: string) {
        var data = ko.toJSON({ 'name': name });

        console.log(name)
        var exists = _.every(this.histories(), (item : SiteTesterTypes.TestHistory) => {return !(name == item.getDate())});

        if ( exists) {

            $.ajax({
                type: 'post',
                async: false,
                contentType: 'application/json',
                dataType: 'json',
                url: this.host() + '/api/GetHistoryByName',
                data: data,
                success: (result, status) => {

                    var toAdd : SiteTesterTypes.TestInstance[] = [];

                    _.forEach(result[this.selectedHistory()], (test : any) => {
                        if (test.result)
                        {
                            var offenders = test.result.offenders || {};
                            var metrics = test.result.metrics || {};

                            toAdd.push(new SiteTesterTypes.TestInstance(offenders, metrics, test.url));
                        }

                    });

                    console.log('Adding to histories..');
                    this.histories.push(new SiteTesterTypes.TestHistory(this.selectedHistory(), toAdd))
                }

            });

        }

        else {
            console.log('Skipping, already in list..')
        }


    }


    makeTimelineGraph(metricType : SiteTesterTypes.MetricData) {

        _.forEach(this.currentData().data, (current : SiteTesterTypes.TestInstance)=> {
            var divId = viewModel.getValidDivId(current.getData().url, metricType.getCssClass());
            var containerDiv = "<div id='" +  divId+ "'></div>";
            var docSelector = "*[data-url='" + current.getData().url + "']";


            // append the div to DOM and set visibility

            var divSelector = '#'  +divId;

            if (!$(divSelector).length) {
                $(docSelector).find(metricType.getCssClass()).append(containerDiv);
                $(divSelector).attr('data-bind', "visible: selectedMode() == 'timeline'");



                $(divSelector).append("<div class='graphContainer' style='width: 100%; height: 400px;'></div>");



                var data = {dates: [], url: current.getData().url, data: {name: metricType, count: []}}; // Data for graph


                _.forEach(this.histories(), (history : SiteTesterTypes.TestHistory) => {

                    var k = _.filter(history.getTests(), (item : SiteTesterTypes.TestInstance)  => {
                        return item.getData().url == current.getData().url
                    });


                    if (k[0]) {
                        data.data.count.push(k[0].getData().offenders.jserrors);
                        data.dates.push(history.getDate());
                    }

                });






                $(divSelector).find('.graphContainer').highcharts({


                    title: {
                        text: 'Fruiot consumption'
                    },

                    xAxis: {
                        categories: data.dates
                    },
                    yAxis: {
                        title: {
                            text: 'Fruit eaten'
                        }
                    },
                    series: [{
                        name: 'Jane',
                        data: [1, 0, 4]
                    }, {
                        name: current.getData().url,
                        data: data.data.count
                    }]


                });



                updateKOBindings(divSelector);
            }


        });
    }


    static getValidDivId(url : string, cssClass : string) {
        return url.split('//')[1].split('.')[0] + cssClass.split('.')[1];
    }


}






