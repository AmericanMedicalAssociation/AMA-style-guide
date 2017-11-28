/**
 * @file
 * Interactions for wayfinder.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
(function ($, Drupal) {
  Drupal.behaviors.wayfinder = {
    attach: function (context, settings) {
      (function ($) {
        // Read wayfinder cookies set from ama-assn domains
        $.cookie.json = true;
        var ama_wayfinder_cookie = $.cookie('ama_wayfinder_cookie');
        if (typeof ama_wayfinder_cookie !== 'undefined') {
          $('.wayfinder_referrer .link-back').show();
          $('.link-back').attr("href", ama_wayfinder_cookie[1]);
          $('.link-back .link-back_text').text(ama_wayfinder_cookie[0]);
        } else {
          $('.wayfinder_referrer .link-back').hide()
        }
      })(jQuery);
    }
  };
})(jQuery, Drupal);
