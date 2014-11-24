$(function() {

    $("ul.nav-tabs a").click(function (e) {
        e.preventDefault();

        $(this).tab('show');

        var selector = '.' + e.target.innerHTML.toLowerCase();

        var tabs = $('.metric-tabs').find(selector);

        var others = $('.metric-tabs').find('div').not(selector);


        console.log(others)
        _.each(others,function(item) {
            var temp = $(item);

            if (temp.hasClass('active')) {
                temp.removeClass('active')
            }


        });
        tabs.addClass('active');

    });


});