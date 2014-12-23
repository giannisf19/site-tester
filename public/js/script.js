
ko.bindingHandlers.updatePage = {

    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {

        if ($(element).hasClass('selected-page')) {

            var interval = setInterval(function() {
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


    $(document.body).on('click', '.page-item',  function() {
        var $item = $(this);
        var index = $item.attr('id').split('').pop();
        $('#content' + index).slideToggle();

        var downArrowClass = 'fa fa-arrow-down';
        var upArrowClass = 'fa fa-arrow-up';

        var arrow = $($item).find('span').eq(1).find('i');

        if (arrow.hasClass(downArrowClass)) {
            arrow.removeClass(downArrowClass);
            arrow.addClass(upArrowClass);
        }

        else {
            arrow.removeClass(upArrowClass);
            arrow.addClass(downArrowClass)
        }
    });



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



});


