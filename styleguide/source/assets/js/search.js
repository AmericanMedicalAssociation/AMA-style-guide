jQuery.noConflict();
(function($) {
  // Search

  // Check when a user is typing in search
  $('#search-field').keypress(function() {
    // add a class to the sibling reset button
    $(this).addClass('is-active');
    $(this).siblings('.search-field_reset').addClass('is-active');
  });

  // After the reset is clicked, remove the classes
  $('.search-field_reset').click(function() {
    $(this).blur();
    $(this).removeClass('is-active');
    $(this).siblings('#search-field').removeClass('is-active');
    $('#search-field').focus();
  });
})(jQuery);