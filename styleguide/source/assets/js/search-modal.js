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

      // animate the way the search modal opens
      $('.search_modal').delay(500).show("drop", {times: 1, distance: 100}, "slow");
      $('.search_modal_inner').animate({"backgroundColor" : "#ededed", "opacity": "1"}, "slow");
      $('.search_modal').animate({"width" : "800px"}, "slow");
      $('.search_modal_inner').delay(440).show("fade", {times: 1, distance: 100}, "slow");

      // Focus search input
      setTimeout(function(){
        $('.search_modal .search-field_input').focus();
      }, 300);
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
