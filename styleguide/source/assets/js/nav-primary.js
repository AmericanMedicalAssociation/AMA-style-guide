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

  function showMenu(clicked) {
    // add a body class saying that the menu is open
    $('body').addClass('body-nav-primary-open');
    $('.nav-primary_list').addClass('nav-primary_list-mobile-open');
  }

  function showOverlay() {
      setTimeout(function () {
        $('.nav-primary_overlay-mobile').addClass('nav-primary_overlay-mobile-on');
      }, 50);
  }

  function closeMenu() {
    $('body').removeClass('body-nav-primary-open');
    $('.nav-primary_list').removeClass('nav-primary_list-mobile-open').addClass('nav-primary_list-mobile-closed');
  }

  function removeActive() {
    setTimeout(function () {
      $('.nav-primary_section').removeClass('nav-primary_section-active').removeClass('is-hidden');
    }, 500);
  }

  function closeOverlay() {
    $('.nav-primary_overlay-mobile').removeClass('nav-primary_overlay-mobile-on');
  }

  function changeActive(section) {
    if (section.hasClass('nav-primary_button')) {
      // toggle a clicked state on the trigger
      $(this).toggleClass('nav-primary_button-clicked');
      // show the overlay
      showOverlay();
    } else {
      section.addClass('nav-primary_section-active');
      section.siblings('.nav-primary_section').removeClass('nav-primary_section-active');
      if ( $(window).width() < 740 ) {
        section.siblings('.nav-primary_section').addClass('is-hidden');
      }
    }
  }

  $(document).on('click', '.body-nav-primary-open, .nav-primary_section, .nav-primary_button', function(e) {
    e.stopPropagation();

    // is this the mobile button?
    if ($(this).hasClass('nav-primary_button')) {
      // is the menu already open?
      if ($('body').hasClass('body-nav-primary-open')) {
        closeMenu();
        closeOverlay();
      } else {
        showMenu($(this));
        showOverlay();
      }
    }
    // is this the nav?
    else if ($(this).hasClass('nav-primary_section')) {
      // is this the active item?
      if ($(this).hasClass('nav-primary_section-active')) {
        if ( $(window).width() < 740 ) {
          removeActive();
        } else {
          closeMenu();
          closeOverlay();
          removeActive();
        }
      } else {
        if (!$('body').hasClass('body-nav-primary-open')) {
          showMenu();
          showOverlay();
        }
        changeActive($(this));
      }
    }
    // is this some other part of the document (clicking outside the nav)?
    else {
      closeMenu();
      closeOverlay();
      removeActive();
    }
  });

  // MOBILE
  // Toggle the primary navigation open and closed when the Menu button is clicked.
  // $('.nav-primary_button').click(function() {
      // toggle a clicked state on the trigger
      // $(this).toggleClass('nav-primary_button-clicked');
      // toggle the open or closed class on the drawer
      // $('.nav-primary_list').toggleClass('nav-primary_list-mobile-closed nav-primary_list-mobile_open');
      // showOverlay();
  // });

})(jQuery);