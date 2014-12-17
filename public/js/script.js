
ko.bindingHandlers.updatePage = {

    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {

        if ($(element).hasClass('selected-page')) {

            var interval = setInterval(function() {

                console.log('Running interval')
                if ($(element).text().length > 0) {
                    bindingContext.$parentContext.$parent.selectedPage($(element).text());
                    clearInterval(interval);

                }
            }, 10)

        }

        $(element).click(function () {
            bindingContext.$parentContext.$parent.selectedPage($(element).text())
        });


    }

};



$(function() {



    $(document).on('click', '.url-page > a', function(e) {
        e.preventDefault();

        var target = $(e.target);

        _.forEach($('.url-page'), function(i) {

            i = $(i);
            if (i.hasClass('selected-page')) {
                i.removeClass('selected-page');
            }
        });

        target.parent().addClass('selected-page');

    });


    jQuery.fn.filterByText = function(textbox) {
        return this.each(function() {
            var select = this;
            var options = [];
            $(select).find('option').each(function() {
                options.push({value: $(this).val(), text: $(this).text()});
            });
            $(select).data('options', options);

            $(textbox).bind('change keyup', function() {
                var options = $(select).empty().data('options');
                var search = $.trim($(this).val());
                var regex = new RegExp(search,"gi");

                $.each(options, function(i) {
                    var option = options[i];
                    if(option.text.match(regex) !== null) {
                        $(select).append(
                            $('<option>').text(option.text).val(option.value)
                        );
                    }
                });
            });
        });
    };


    $(document).on('click', 'ul.page-selector a', function (e) {
        e.preventDefault();

        //Get the clicked tab
        var selector = '.' + e.target.innerHTML.toLowerCase();

        //Get the tab contents
        var tabs = $('.metric-tabs').find(selector);

        //Find the tabs that need to be disabled
        var others = $('.metric-tabs').find('div').not(selector);

        _.each(others,function(item) {
            var temp = $(item);

            if (temp.hasClass('active')) {
                temp.removeClass('active')
            }
        });

        //Enable selected tab contents.
        tabs.addClass('active');

    });

    window.updateKOBindings = function(newElement) {

       if (!newElement) {
           ko.applyBindings(vm);
       }

        else {
           var toAdd = $(newElement)[0];

           try {
               ko.applyBindings(vm, toAdd)
           }

           catch(ex) {

           }
       }
    };

    window.prepare = function(offenders) {
        _.map(offenders, function(item, index) {return {'name' : index, 'data' : item}});
    };


    window.getSelectedPage = function() {
      return $('.selected-page').find('a').text();
    };



    $('.metric-filter').on('keyup', function(e,data) {
       var box = $(e.target).siblings().eq(0);
        $(box).filterByText(e.target)
    });
});


