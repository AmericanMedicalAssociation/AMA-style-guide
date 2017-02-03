/**
 * @file nav-primary.js
 *
 * Copyright 2017 Palantir.net, Inc.
 */

$(document).ready(function() {

  // Mobile Primary navigation functionality.
  $('.nav-primary_list').each(function () {

    // Hide the sub-navigation menus initially.
    $('.nav-primary_list_subnav').each(function() {
      $(this).removeClass('nav-primary_list_subnav-visible');
    });

    // $('.nav-primary_list-item').addClass('nav-primary_list-item-hidden');

    // Toggle the primary navigation open and closed when the Menu button is clicked.
    $('.nav-primary_button-menu').click(function () {
      $(this).toggleClass('nav-primary_button-menu-clicked');
      $('.nav-primary_list').toggleClass('nav-primary_list-closed nav-primary_list-open');
      // When the menu is open, apply the overlay.
      $('.nav-primary-menu_overlay-mobile').toggleClass('nav-primary-menu_overlay-mobile-on');
    });

    // Primary nav list item click to open sub-navigation.
    $('.nav-primary_list-item_title a').click(function () {
      var parent = $(this).parents('.nav-primary_list > .nav-primary_list-item');

      // Show the sub-navigation of the item that is clicked.
      if(parent.hasClass('nav-primary_list-item-active')) {
        parent.removeClass('nav-primary_list-item-active');
        parent.children('.nav-primary_list-item_title').removeClass('nav-primary_list-item_title-active');
        parent.children('.nav-primary_list_subnav').removeClass('nav-primary_list_subnav-visible');
      } else {
        parent.addClass('nav-primary_list-item-active');
        parent.children('.nav-primary_list-item_title').addClass('nav-primary_list-item_title-active');
        parent.children('.nav-primary_list_subnav').addClass('nav-primary_list_subnav-visible');
      }
    });

  });
});