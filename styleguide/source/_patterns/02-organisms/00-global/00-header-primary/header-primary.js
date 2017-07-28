jQuery.noConflict();
(function($) {
  //check if a primary nav exists and is visible on the page
  //otherwise we shouldn't do any of this
  if ($('.header-primary-span').length > 0){
    initializePrimaryHeader();
  }

  // Find height of ribbon and header-primary to create proper spacing
  function checkHeight() {
    var headerHeight = $('.header-primary').height();
    var ribbonHeight = $('.ribbon').height();

    $('.header-primary-span').css({'height':(headerHeight)+'px'});
    $('.header-primary').css({'top':(ribbonHeight)+'px'});
  }

  function initializePrimaryHeader(){
    // Set height on page load
    setTimeout(function(){ checkHeight(); }, 300);
    // Check height on window resize
    $(window).resize(checkHeight);

    // Add class to header-primary on scroll
    $(window).scroll(function() {
      var scroll = $(window).scrollTop();
      var os = $('.header-primary-span').offset().top;
      var ht = $('.header-primary-span').height();

      if(scroll > os + ht){
        $(".header-primary").addClass("header-primary--sticky");
      } else {
        $(".header-primary").removeClass("header-primary--sticky");
      }
    });
  }
})(jQuery);