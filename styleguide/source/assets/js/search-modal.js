/**
 * @file search-modal.js
 *
 * Copyright 2017 Palantir.net, Inc.
 */

jQuery.noConflict();
(function($) {

  // Trigger events on search button click
  $('.button-search').click(function() {
    // Remove classes for nav dropdowns
    $('.nav-primary_list-item, .nav-primary_list-item_title').removeClass('is-active');
    $('.nav-primary_list_subnav').removeClass('is-open');

    // If is-open class exists
    if( $('.search_modal').hasClass('is-open') ) {
      $('.search_modal').removeClass('is-open');
      $('.nav-primary-menu_overlay-mobile').removeClass('nav-primary-menu_overlay-mobile-on');
    }

    // If is-open class doesn't exist
    else {
      $('.search_modal').addClass('is-open');
      $('.nav-primary-menu_overlay-mobile').addClass('nav-primary-menu_overlay-mobile-on');
    };

    // Remove nav primary list open class and add closed class on search button click
    if ( $(window).width() < 740 ) {
      $('.nav-primary_list').removeClass('nav-primary_list-open').addClass('nav-primary_list-closed');
    };
  });

  // Remove classes when clicking close
  $('.search_modal_close').click(function() {
    $('.search_modal').removeClass('is-open');
    $('.nav-primary-menu_overlay-mobile').removeClass('nav-primary-menu_overlay-mobile-on');
  });

})(jQuery);
