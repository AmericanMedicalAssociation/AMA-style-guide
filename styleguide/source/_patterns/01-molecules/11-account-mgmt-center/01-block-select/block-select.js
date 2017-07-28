/**
 * @file
 * Toggle select block message.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.blockSelect = {
     attach: function (context, settings) {
       (function ($) {

         $('.block-select').click(function() {
           $(this).toggleClass('block-select-selected');
           $('.block-select_message').toggleClass('block-select_message-hidden');  });

         })(jQuery);
       }
     };
   })(jQuery, Drupal);
