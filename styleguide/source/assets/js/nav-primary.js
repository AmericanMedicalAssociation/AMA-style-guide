/**
 * @file nav-primary.js
 *
 * Copyright 2017 Palantir.net, Inc.
 */

$(document).ready(function() {

  // Mobile Primary navigation functionality.
  $('.nav-primary_list').each(function () {

    $('.nav-primary_list-item').addClass('nav-primary_list-item-hidden');

    // Toggle the primary navigation open and closed when the Menu button is clicked.
    $('.nav-primary_button-menu').click(function () {
      $(this).toggleClass('nav-primary_button-menu-clicked');
      $('.nav-primary_list').toggleClass('nav-primary_list-closed nav-primary_list-open');
      // When the menu is open, apply the overlay.
      $('.nav-primary-menu_overlay-mobile').toggleClass('nav-primary-menu_overlay-mobile-on');
    });

    // Primary nav list item click to open sub-navigation.
    $('.nav-primary_list-item_title a').click(function () {
      var parent = $(this).parent();

      // Hide the sub-navigation menus initially.
      $('.nav-primary_list_subnav').removeClass('nav-primary_list_subnav-initial');

      // Show the sub-navigation of the item that is clicked.
      parent.addClass('nav-primary_list-item-active').removeClass('nav-primary_list-item-hidden');
      parent.children('.nav-primary_list-item_title').addClass('nav-primary_list-item_title-active');
    });

  });
});