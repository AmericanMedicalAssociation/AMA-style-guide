jQuery.noConflict();
(function($) {

  // checkWidth function
  function checkWidth() {
    if (($(window).width() >= 900)) { // 900px = $bp-med
      // Show all li selectors
      $('.tabs-audience_selector_list > li').css('display', 'inline-block');
    }
    else {
      // Display list-item for all li selectors
      $('.tabs-audience_selector_list > li').css('display', 'list-item');
      // Hide all li selectors expect first one
      $('.tabs-audience_selector_list > li:gt(0)').hide();
    }
  }

  // Run checkWidth
  checkWidth();
  // Re-run checkWidth on window resize
  $(window).resize(checkWidth);

  // Mobile Audience Selector tabs
  $('.tabs-audience_selector_list').click(function () {
    // If viewport is smaller than 900px
    if (($(window).width() < 900)) { // 900px = $bp-med
      // Add the active class to the list when it is clicked
      $(this).toggleClass('open');
      // Toggle hidden items on click
      $(this).children('li:gt(0)').slideToggle();
    }
  });

})(jQuery);
