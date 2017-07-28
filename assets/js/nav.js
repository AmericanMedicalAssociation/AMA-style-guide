/**
 * @file
 * Ribbon nav user interactions.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.ribbonnav = {
     attach: function (context, settings) {
       (function ($) {

         // Search

         // When a user clicks on the ribbon trigger (main)
         $('.ribbon_dropdown_trigger').click(function() {
           // Unfocus on the dropdown
           $(this).blur();
           // add a class to the sibling dropdown
           $(this).toggleClass('is-active');
           $(this).siblings('.ribbon_dropdown_nav').toggleClass('is-active').slideToggle(300);
           $('.ribbon_user-menu_trigger').removeClass('is-active');
           $('.ribbon_user-menu_nav').removeClass('is-active').slideUp(300);;
           $('.ribbon_user-menu_trigger-auth').removeClass('is-active');
           $('.ribbon_user-menu_nav-child').removeClass('is-active').slideUp(300);
         });

         // When a user clicks on the ribbon trigger for user dropdown
         $('.ribbon_user-menu_trigger').click(function() {
           // Unfocus on the dropdown
           $(this).blur();
           // add a class to the sibling dropdown
           $(this).toggleClass('is-active');
           $(this).siblings('.ribbon_user-menu_nav').toggleClass('is-active').slideToggle(300);
           $('.ribbon_dropdown_trigger').removeClass('is-active');
           $('.ribbon_dropdown_nav').removeClass('is-active').slideUp(300);
         });

         // When a user clicks on the ribbon trigger for authenticated user dropdown
         $('.ribbon_user-menu_trigger-auth').click(function() {
           // Unfocus on the dropdown
           $(this).blur();
           // add a class to the sibling dropdown
           $(this).toggleClass('is-active');
           $(this).siblings('.ribbon_user-menu_nav-child').toggleClass('is-active').slideToggle(300);
           $('.ribbon_dropdown_trigger').removeClass('is-active');
           $('.ribbon_dropdown_nav').removeClass('is-active').slideUp(300);
         });

       })(jQuery);
     }
   };
 })(jQuery, Drupal);
