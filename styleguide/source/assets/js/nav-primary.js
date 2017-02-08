/**
 * @file nav-primary.js
 *
 * Copyright 2017 Palantir.net, Inc.
 */

jQuery.noConflict();
(function($) {
  // Mobile Primary navigation functionality.
  $('.nav-primary_button-menu').click(function () {

    // Add the active class to the button when it is clicked.
    $('.nav-primary').toggleClass('open');
  });

})(jQuery);