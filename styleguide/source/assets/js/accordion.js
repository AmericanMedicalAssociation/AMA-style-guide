jQuery.noConflict();
(function($) {
  // Search

  // When a user clicks on the ribbon trigger (main)
  $('.accordion-trigger').click(function() {
    // Unfocus on the trigger
    $(this).blur();
    // add a class to the sibling accordion content
    $(this).toggleClass('is-active');
    $(this).siblings('.accordion-content').toggleClass('is-active').slideToggle(300);
  });


})(jQuery);
