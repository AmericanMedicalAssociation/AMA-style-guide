$(document).ready(function() {
  // Search

  // When a user clicks on the ribbon trigger (main)
  $('.jump-nav_title').click(function() {
    // Unfocus on the dropdown
    $(this).blur();
    // add a class to the parent
    $(this).parents('#jump-nav').toggleClass('is-closed');
  });

});
