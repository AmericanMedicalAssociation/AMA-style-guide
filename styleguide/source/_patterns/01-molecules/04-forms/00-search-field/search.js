/**
 * @file
 * Interactions for search field.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.searchField = {
     attach: function (context, settings) {
       (function ($) {

         // Search

         // Check when a user is typing in search
         $('#search-field').keypress(function() {
           // add a class to the sibling reset button
           $(this).addClass('is-active');
           $(this).siblings('.search-field_reset').addClass('is-active');
         });

         // After the reset is clicked, remove the classes
         $('.search-field_reset').click(function() {
           $(this).blur();
           $(this).removeClass('is-active');
           $(this).siblings('#search-field').removeClass('is-active');
           $('#search-field').focus();
         });

       })(jQuery);
     }
   };
 })(jQuery, Drupal);
