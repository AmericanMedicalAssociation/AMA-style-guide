/**
 * @file nav-primary.js
 *
 * Copyright 2017 Palantir.net, Inc.
 */

$(document).ready(function() {

  // Mobile Primary navigation functionality.
  $('.nav-primary_list').each(function () {

    // Toggle the list open and closed when the menu button is clicked.
    $('.nav-primary_button-menu').click(function () {
      $(this).toggleClass('nav-primary_button-menu-clicked');
      $('.nav-primary_list').toggleClass('nav-primary_list-closed nav-primary_list-open');
      // When the menu is open, apply the overlay.
      $('.nav-primary-menu_overlay-mobile').toggleClass('nav-primary-menu_overlay-mobile-on');
    });

  });

});