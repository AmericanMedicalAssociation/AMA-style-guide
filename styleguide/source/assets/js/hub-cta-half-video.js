/**
 * @file
 * Initialize fitVid for YouTube vieos.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.fitvidinit = {
     attach: function (context, settings) {
       (function ($) {

         $(document).ready(function(){
           $('iframe[src*="youtube"]').parent().fitVids();
         });

       })(jQuery);
     }
   };
 })(jQuery, Drupal);
