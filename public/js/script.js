$(function() {

    $(".nav a").on("click", function(){
        $(".nav li").find(".active").removeClass("active");
        $(this).parent().addClass("active");

    });

});

