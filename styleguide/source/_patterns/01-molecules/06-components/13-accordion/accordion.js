/**
 * @file
 * Make accordions accordion-y.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.accordion = {
     attach: function (context, settings) {
       (function ($) {

         // Search

         // When a user clicks on the ribbon trigger (main)
         $('.accordion-trigger').click(function() {
           // Unfocus on the trigger
           $(this).blur();
           // add a class to the sibling accordion content
           $(this).toggleClass('is-active');
           $(this).siblings('.accordion-content').toggleClass('is-active').slideToggle(300);
         });

       })(jQuery);
     }
   };
 })(jQuery, Drupal);
