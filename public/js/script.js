$(function() {

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



});