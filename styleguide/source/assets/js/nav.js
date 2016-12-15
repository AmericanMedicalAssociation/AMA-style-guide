$(document).ready(function() {
  // Search

  // Check when a user is typing in search
  $('.ribbon_dropdown_trigger').click(function() {
    // Unfocus on the dropdown
    $(this).blur();
    // add a class to the sibling reset button
    $(this).toggleClass('is-active');
    $(this).siblings('.ribbon_dropdown_nav').toggleClass('is-active');
  });
});