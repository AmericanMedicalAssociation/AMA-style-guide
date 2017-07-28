/**
 * @file
 * Make primary header sticky.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.headerPrimary = {
     attach: function (context, settings) {
       (function ($) {

         //check if a primary nav exists and is visible on the page
         //otherwise we shouldn't do any of this
         if ($('.header-primary-span').length > 0){
           initializePrimaryHeader();
         }

         // Find height of ribbon and header-primary to create proper spacing
         function checkHeight() {
           var headerHeight = $('.header-primary').height();
           var ribbonHeight = $('.ribbon').height();

           $('.header-primary-span').css({'height':(headerHeight)+'px'});
           $('.header-primary').css({'top':(ribbonHeight)+'px'});
         }

         function initializePrimaryHeader(){
           // Set height on page load
           setTimeout(function(){ checkHeight(); }, 100);
           // Check height on window resize
           $(window).resize(checkHeight);

           // Add class to header-primary on scroll
           $(window).scroll(function() {
             var scroll = $(window).scrollTop();
             var os = $('.header-primary-span').offset().top;
             var ht = $('.header-primary-span').height();

             if(scroll > os + ht){
               $(".header-primary").addClass("header-primary--sticky");
             } else {
               $(".header-primary").removeClass("header-primary--sticky");
             }
           });
         }

       })(jQuery);
     }
   };
 })(jQuery, Drupal);
