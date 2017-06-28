jQuery.noConflict();
(function($) {

  var bp_med = 900; // 900px = $bp-med css variable

  // checkWidth function
  function checkWidth() {
    if (($(window).width() >= bp_med)) {
      // Show all li selectors
      $('.tabs-course_browser_list-tabs > li').css('display', 'inline-block');
    }
    else {
      // Display list-item for all li selectors
      $('.tabs-course_browser_list-tabs > li').css('display', 'list-item');
      // Hide all li selectors expect first one
      $('.tabs-course_browser_list-tabs > li:gt(0)').hide();
    }
  }

  // Run checkWidth
  checkWidth();
  // Re-run checkWidth on window resize
  $(window).resize(checkWidth);

  // Mobile Course Browser tabs
  $('.tabs-course_browser_list-tabs').click(function () {
    // If viewport is smaller than 900px
    if (($(window).width() < bp_med)) {
      // Add the active class to the list when it is clicked
      $(this).toggleClass('open');
      // Toggle hidden items on click
      $(this).children('li:gt(0)').slideToggle();
    }
  });

})(jQuery);
