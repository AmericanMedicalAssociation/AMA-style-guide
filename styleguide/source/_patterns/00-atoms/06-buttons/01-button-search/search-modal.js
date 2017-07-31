/**
 * @file
 * Triger overlay when search box is used.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.searchModal = {
     attach: function (context, settings) {
       (function ($) {

         // Trigger events on search button click
         $('.button-search').click(function() {

           // Remove classes for nav dropdowns
           $('.nav-primary_section, .nav-primary_section').removeClass('nav-primary_section-active, nav-primary_section-active');
           $('.nav-primary_section_subnav').removeClass('is-open');

           // If is-open class exists
           if( $('.search_modal').hasClass('is-open') ) {
             $('.search_modal').removeClass('is-open');
             $('.nav-primary_overlay-mobile').removeClass('nav-primary_overlay-mobile-on');
           }

           // If is-open class doesn't exist
           else {
             $('.search_modal').addClass('is-open');
             $('.nav-primary_overlay-mobile').addClass('nav-primary_overlay-mobile-on');

             // Focus search input
             setTimeout(function(){
               $('.search_modal .search-field_input').focus();
             }, 300);
           };

           // Remove nav primary list open class and add closed class on search button click
           if ( $(window).width() < 740 ) {
             $('.nav-primary_list').removeClass('nav-primary_list-mobile-open').addClass('nav-primary_list-mobile-closed');
           };
         });

         // Remove classes when clicking close
         $('.search_modal_close').click(function() {
           $('.search_modal').removeClass('is-open');
           $('.nav-primary_overlay-mobile').removeClass('nav-primary_overlay-mobile-on');
         });

       })(jQuery);
     }
   };
 })(jQuery, Drupal);
