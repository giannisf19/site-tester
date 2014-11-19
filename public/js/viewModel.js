/**
 * Created by gfoulidis on 11/11/2014.
 */





var viewModel = function(settings) {
    var self = this;


    var count =0;
    var socket = io.connect('http://localhost:300');

    self.newItem = ko.observable('http://');
    self.urls = ko.observableArray(settings.urls);
    self.isValid = ko.computed(function() {
        var pattern = new RegExp(/^(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/);

        return pattern.test(self.newItem());
    }, self);

    self.isRunning = ko.observable();


    self.add = function() {
        if (! _.contains(self.urls(), self.newItem())) {
            self.urls.unshift(self.newItem());
            self.newItem('http://');
            return;
        }

        if (count >= 1) {toastr.error("Url already in list"); count =-1}
        shakeForm();
        count++

    };

    self.remove = function(item) {
        self.urls.remove(item);

    };


    function shakeForm() {
        var l = 20;
        for( var i = 0; i < 10; i++ )
            $( "form > div > input").eq(0).animate( { 'margin-left': "+=" + ( l = -l ) + 'px' }, 30);
    }


    socket.on('isRunning', function (data) {
        console.log(data.isRunning);
        self.isRunning = data.isRunning;
    });


};







