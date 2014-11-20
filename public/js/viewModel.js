/**
 * Created by gfoulidis on 11/11/2014.
 */





var viewModel = function(settings) {
    var self = this;


    var count =0;
    var socket = io.connect('http://localhost:300');


    self.host = ko.observable('http://localhost:300');
    self.cron = ko.observable(settings.cron);
    self.screenshot = ko.observable(settings.screenshot);
    self.newItem = ko.observable('http://');
    self.urls = ko.observableArray(settings.urls);

    self.isValid = ko.computed(function() {
        var pattern = new RegExp(/^(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/);

        return pattern.test(self.newItem());
    }, self);

    self.isRunning = ko.observable();
    self.canRun = ko.computed(function() {
        return !self.isRunning() && self.urls().length
    }, self);

    self.add = function() {
        if (! _.contains(self.urls(), self.newItem())) {
            self.urls.unshift(self.newItem());
            self.newItem('http://');
            pushSettingsToServer();
            return;
        }

        if (count >= 1) {toastr.error("Url already in list"); count =-1}
        shakeForm();
        count++

    };

    self.remove = function(item) {
        self.urls.remove(item);
        pushSettingsToServer();

    };


    self.runNow = function() {
        $.ajax({
            type: 'post',
            url: self.host() + '/runNow'
        });
    };

    self.deleteDb = function() {
        if (confirm('Are you sure ?')) {
            $.ajax({
                type: 'post',
                url: self.host() + '/deleteDb'
            });
        }


    };

    function shakeForm() {
        var l = 20;
        for( var i = 0; i < 10; i++ )
            $( "form > div > input").eq(0).animate( { 'margin-left': "+=" + ( l = -l ) + 'px' }, 30);
    }



    function pushSettingsToServer() {

        var data = ko.toJSON({settings :{'urls' : self.urls(), 'screenshot' : self.screenshot(), 'cron' : self.cron()}}) ;

        $.ajax({
            type: 'post',
            url: self.host() + '/saveSettings',
            contentType: 'application/json',
            data: data
        });
    }


    socket.on('isRunning', function (data) {
        console.log(data.isRunning);
        self.isRunning( data.isRunning);
    });





        if($('#cron').length)
        $('#cron').cron({
            initial: self.cron(),
            onChange: function() {
                self.cron($('#cron').cron('value'));
                pushSettingsToServer();

            },
            useGentleSelect: true
        });


        if ($('#screenshot').length)
        {
            $('#screenshot').on('change', function(){
                self.screenshot($(this).prop('checked'));
                pushSettingsToServer();
            });

            $('#screenshot').prop('checked', self.screenshot());
        }







};







