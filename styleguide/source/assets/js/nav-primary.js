/**
 * @file nav-primary.js
 *
 * Copyright 2017 Palantir.net, Inc.
 */

jQuery.noConflict();
(function($) {

  // Toggle the primary navigation open and closed when the Menu button is clicked.
  $('.nav-primary-menu_button').click(function() {
    if ( $(window).width() < 740 ) {
      // Unfocus on the dropdown
      $(this).blur();
      // toggle a clicked state on the trigger
      $(this).toggleClass('nav-primary-menu_button-clicked');
      // toggle the open or closed class on the drawer
      $('.nav-primary_list').toggleClass('nav-primary_list-closed nav-primary_list-open');
      // When the menu is open, apply the overlay.
      $('.nav-primary-menu_overlay-mobile').toggleClass('nav-primary-menu_overlay-mobile-on');
      // remove active classes on children
      $('.nav-primary_list-item_title').removeClass('is-active');
      $('.nav-primary_list-item').removeClass('is-active');
      $('.nav-primary_list_subnav').removeClass('is-open');
      $('.nav-primary_list-item').removeClass('is-hidden');
    }
  });

  // Mobile Primary navigation functionality.
  $('.nav-primary_list').each(function () {

    // Hide the sub-navigation menus initially.
    $('.nav-primary_list_subnav').each(function() {
      $(this).removeClass('nav-primary_list_subnav-visible');
    });

    // click on the primary nav item
    $('.nav-primary_list-item_title').click(function () {
      $(this).blur();
      // toggle a clicked state for this item
      $(this).toggleClass('is-active');
      // toggle a clicked state for this item
      $(this).parents('.nav-primary_list-item').toggleClass('is-active');
      // add an open state to its sibling subnav
      $(this).siblings('.nav-primary_list_subnav').toggleClass('is-open');
      // Remove active and open states fromm sibling drawer items
      $(this).parents('.nav-primary_list-item').siblings('.nav-primary_list-item').children('.nav-primary_list-item_title').removeClass('is-active');
      $(this).parents('.nav-primary_list-item').siblings('.nav-primary_list-item').children('.nav-primary_list_subnav').removeClass('is-open');
      $(this).parents('.nav-primary_list-item').siblings('.nav-primary_list-item').removeClass('is-active');

      if ( $(window).width() > 740 ) {
        // When the menu is open, apply the overlay.
        $('.nav-primary-menu_overlay-mobile').toggleClass('nav-primary-menu_overlay-mobile-on');
      }

      if ( $(window).width() < 740 ) { 
        // hide the other primary items
        $(this).parents('.nav-primary_list-item').siblings('.nav-primary_list-item').toggleClass('is-hidden');
        $(this).parents('.nav-primary_list-item').removeClass('is-hidden');

        // When you click the back button revert all that stuff above.
        $(this).siblings('.nav-primary_list_subnav').children('.nav-primary_list_subnav_list-item-back').click(function () {
          $('.nav-primary_list-item_title').removeClass('is-active');
          $('.nav-primary_list-item').removeClass('is-active');
          $('.nav-primary_list_subnav').removeClass('is-open');
          $('.nav-primary_list-item').removeClass('is-hidden');
        });
      }
    });

  });

})(jQuery);
