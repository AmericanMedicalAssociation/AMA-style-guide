/**
 * @file nav-primary.js
 *
 * Copyright 2017 Palantir.net, Inc.
 */

jQuery.noConflict();
(function($) {

  // Find height of ribbon and header-primary to create proper spacing
  function checkHeight() {
    var headerHeight = $('.header-primary').height();
    var ribbonHeight = $('.ribbon').height();

    $('.header-primary-span').css({'height':(headerHeight)+'px'});
    $('.header-primary').css({'top':(ribbonHeight)+'px'});
  }

  // Set height on page load
  setTimeout(function(){ checkHeight(); }, 100);
  // Check height on window resize
  $(window).resize(checkHeight);

  // Add class to header-primary on scroll
  $(window).scroll(function() {
    var scroll = $(window).scrollTop();
    var os = $('.header-primary-span').offset().top;
    var ht = $('.header-primary-span').height();

    if(scroll > os + ht){
      $(".header-primary").addClass("header-primary--sticky");
    } else {
      $(".header-primary").removeClass("header-primary--sticky");
    }
  });

  // Toggle the primary navigation open and closed when the Menu button is clicked.
  $('.nav-primary_button').click(function() {
    if ( $(window).width() < 740 ) {
      // Unfocus on the dropdown
      $(this).blur();
      // toggle a clicked state on the trigger
      $(this).toggleClass('nav-primary_button-clicked');
      // toggle the open or closed class on the drawer
      $('.nav-primary_list').toggleClass('nav-primary_list-mobile-closed nav-primary_list-mobile_open');
      // remove active classes on children
      $('.nav-primary_section_title').removeClass('nav-primary_section_title-active');
      $('.nav-primary_section').removeClass('nav-primary_section-active');
      $('.nav-primary_section_subnav').removeClass('nav-primary_section_subnav-open');
      $('.nav-primary_section').removeClass('is-hidden');
      // remove is-open class on search modal
      $('.search_modal').removeClass('is-open');

      // When the menu is open, apply the overlay.
      if ($('.nav-primary_list').hasClass('nav-primary_list-open')) {
        $('.nav-primary_overlay-mobile').addClass('nav-primary_overlay-mobile-on');
      }

      // Else remove overlay class
      else {
        $('.nav-primary_overlay-mobile').removeClass('nav-primary_overlay-mobile-on');
      }
    }
  });

  // Primary navigation functionality.
  $('.nav-primary_list').each(function () {

    // Hide the sub-navigation menus initially.
    $('.nav-primary_section_subnav').each(function() {
      $(this).removeClass('nav-primary_section_subnav-visible');
    });

    // click on the primary nav item.
    $('.nav-primary_section_title').click(function () {
      $('.link-nav-primary').blur();
      // toggle a clicked state for this item
      $(this).toggleClass('nav-primary_section_title-active');
      // toggle a clicked state for this item
      $(this).parents('.nav-primary_section').toggleClass('nav-primary_section-active');
      // add an open state to the nav container
      $(this).parents('.nav-primary_list').addClass('nav-primary_list-open');
      // add an open state to its sibling subnav
      $(this).siblings('.nav-primary_section_subnav').toggleClass('nav-primary_section_subnav-open');
      // Remove active and open states from sibling drawer items.
      $(this).parents('.nav-primary_section').siblings('.nav-primary_section').children('.nav-primary_section_title').removeClass('nav-primary_section_title-active');
      $(this).parents('.nav-primary_section').siblings('.nav-primary_section').children('.nav-primary_section_subnav').removeClass('nav-primary_section_subnav-open');
      $(this).parents('.nav-primary_section').siblings('.nav-primary_section').removeClass('nav-primary_section-active');
      // Remove is-open class on search modal
      $('.search_modal').removeClass('is-open');

      if ($(window).width() > 740) {
        setTimeout(function () {
          // if the menu is open, apply the overlay
          if ($('.nav-primary_section_subnav').is(':visible')) {
            $('.nav-primary_overlay-mobile').addClass('nav-primary_overlay-mobile-on');
            // if the menu is not open, remove the overlay
          } else {
            $('.nav-primary_overlay-mobile').removeClass('nav-primary_overlay-mobile-on');
          }
        }, 50);
      }

      if ( $(window).width() < 740 ) {
        // hide the other primary items
        $(this).parents('.nav-primary_section').siblings('.nav-primary_section').toggleClass('is-hidden');
        $(this).parents('.nav-primary_section').removeClass('is-hidden');

        // When you click the back button revert all that stuff above.
        $(this).siblings('.nav-primary_section_subnav').children('.nav-primary_section_subnav_back').click(function () {
          $('.nav-primary_section_title').removeClass('nav-primary_section_title-active');
          $('.nav-primary_section').removeClass('nav-primary_section-active');
          $('.nav-primary_section_subnav').removeClass('nav-primary_section_subnav-open');
          $('.nav-primary_section').removeClass('is-hidden');
        });
      }
    });
  });

})(jQuery);
