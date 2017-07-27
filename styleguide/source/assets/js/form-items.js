/**
 * @file form-items.js
 *
 * Reference http://codepen.io/anon/pen/GHKJj
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */

(function ($, Drupal) {
  Drupal.behaviors.formitems = {
    attach: function (context, settings) {
      (function ($) {

        //////////////////////////////////
        // Validate form
        //////////////////////////////////

        // Validate on page load
        $('.simple-step-form, .multi-step-form').validate({
          rules: {
            tel: {
              number: true
            }
          },
          ignore: ':hidden'
        });

        // Multi step form next link
        $('.step-form-next').click(function() {

          // Fieldset variables
          var current_fs = $(this).closest('fieldset');
          var next_fs = $(this).closest('fieldset').next('fieldset');
          var prev_fs = $(this).closest('fieldset').prevAll('fieldset');

          // If current fieldset is valid go to next fieldset
          if($('.multi-step-form').valid()) {
            current_fs.removeClass('active').addClass('complete');
            next_fs.addClass('active');
            prev_fs.addClass('complete');
          }
        });

        // Step anchor links
        $('.step-form-anchor').click(function() {

          // Fieldset variable
          var current_fs = $(this).closest('fieldset');

          // If current fieldset has class do this
          if(current_fs.hasClass('complete')) {
            current_fs.removeClass('complete').addClass('active');
            current_fs.siblings('fieldset').removeClass('active');
          }
        });


        //////////////////////////////////
        // Initiate form icons
        //////////////////////////////////

        // Create variable for all selectors needed for icon validator
        var iconSelector = $('.form-item input[type="text"], .form-item input[type="email"], .form-item input[type="url"], .form-item input[type="date"], .form-item input[type="month"], .form-item input[type="time"], .form-item input[type="datetime"], .form-item input[type="datetime-local"], .form-item input[type="week"], .form-item input[type="number"], .form-item input[type="search"], .form-item input[type="tel"], .form-item input[type="color"], .form-item select, .form-item textarea, .form-item-radio label.error, .form-item-radio-label_group label:last-child, .form-item-checkbox label.error');

        // Create form item icon
        $(iconSelector).after('<span class="form-item_icon"></span>');


        //////////////////////////////////
        // Initiate label show/hide
        //////////////////////////////////
        var onClass = 'on';
        var showClass = 'show';

        $('input, textarea, select')
        .bind('checkval', function()
        {
          var label = $(this).prev('label');

          if (this.value !== '')
          label.addClass(showClass);

          else
          label.removeClass(showClass);
        })
        .on('keyup', function()
        {
          $(this).trigger('checkval');
        })
        .on('focus', function()
        {
          $(this).prev('label').addClass(onClass);
        })
        .on('blur', function()
        {
          $(this).prev('label').removeClass(onClass);
        })
        .trigger('checkval');

        $('select')
        .on('change', function()
        {
          var $this = $(this);

          if ($this.val() == '')
          $this.addClass('watermark');

          else
          $this.removeClass('watermark');

          $this.trigger('checkval');
        })
        .change();


        //////////////////////////////////
        // Show / Hide password text
        //////////////////////////////////

        $('.form-item_password').click(function() {
          $(this).toggleClass('show');

          if($(this).hasClass('show')) {
            $(this).siblings('input').attr('type', 'text');
          }
          else {
            $(this).siblings('input').attr('type', 'password');
          }
        });

      })(jQuery);
    }
  };
})(jQuery, Drupal);
