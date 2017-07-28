/*global jQuery */
/*!
* FitVids 1.0
*
* Copyright 2011, Chris Coyier - http://css-tricks.com + Dave Rupert - http://daverupert.com
* Credit to Thierry Koblentz - http://www.alistapart.com/articles/creating-intrinsic-ratios-for-video/
* Released under the WTFPL license - http://sam.zoy.org/wtfpl/
*
* Date: Thu Sept 01 18:00:00 2011 -0500
*/

(function( $ ){

  $.fn.fitVids = function( options ) {
    var settings = {
      customSelector: null
    }

    var div = document.createElement('div'),
        ref = document.getElementsByTagName('base')[0] || document.getElementsByTagName('script')[0];

    div.className = 'fit-vids-style';
    div.innerHTML = '&shy;<style>         \
      .fluid-width-video-wrapper {        \
         width: 100%;                     \
         position: relative;              \
         padding: 0;                      \
      }                                   \
                                          \
      .fluid-width-video-wrapper iframe,  \
      .fluid-width-video-wrapper object,  \
      .fluid-width-video-wrapper embed {  \
         position: absolute;              \
         top: 0;                          \
         left: 0;                         \
         width: 100%;                     \
         height: 100%;                    \
      }                                   \
    </style>';

    ref.parentNode.insertBefore(div,ref);

    if ( options ) {
      $.extend( settings, options );
    }

    return this.each(function(){
      var selectors = [
        "iframe[src*='player.vimeo.com']",
        "iframe[src*='www.youtube.com']",
        "iframe[src*='www.kickstarter.com']",
        "object",
        "embed"
      ];

      if (settings.customSelector) {
        selectors.push(settings.customSelector);
      }

      var $allVideos = $(this).find(selectors.join(','));

      $allVideos.each(function(){
        var $this = $(this);
        if (this.tagName.toLowerCase() == 'embed' && $this.parent('object').length || $this.parent('.fluid-width-video-wrapper').length) { return; }
        var height = ( this.tagName.toLowerCase() == 'object' || $this.attr('height') ) ? $this.attr('height') : $this.height(),
            width = $this.attr('width') ? $this.attr('width') : $this.width(),
            aspectRatio = height / width;
        if(!$this.attr('id')){
          var videoID = 'fitvid' + Math.floor(Math.random()*999999);
          $this.attr('id', videoID);
        }
        $this.wrap('<div class="fluid-width-video-wrapper"></div>').parent('.fluid-width-video-wrapper').css('padding-top', (aspectRatio * 100)+"%");
        $this.removeAttr('height').removeAttr('width');
      });
    });
  }
})( jQuery );
/**
 * @file
 * Interactions for form validation.
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

/**
 * @file
 * Behaviors for main menu dropdowns.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.primaryNav = {
     attach: function (context, settings) {
       (function ($) {

         function closeSearch() {
           search = $('.search_modal');
           if (search.hasClass('is-open')) {
             $('.search_modal').removeClass('is-open');
           }
         }

         function showMenu() {
           // add a body class saying that the menu is open
           $('body').addClass('body-nav-primary-open');
           $('.nav-primary_list').addClass('nav-primary_list-mobile-open');
         }

         function showOverlay() {
           setTimeout(function () {
             $('.nav-primary_overlay-mobile').addClass('nav-primary_overlay-mobile-on');
           }, 50);
         }

         function closeMenu() {
           $('body').removeClass('body-nav-primary-open');
           $('.nav-primary_list').removeClass('nav-primary_list-mobile-open').addClass('nav-primary_list-mobile-closed');
         }

         function removeActive() {
           setTimeout(function () {
             $('.nav-primary_section').removeClass('nav-primary_section-active').removeClass('is-hidden');
           }, 500);
         }

         function closeOverlay() {
           $('.nav-primary_overlay-mobile').removeClass('nav-primary_overlay-mobile-on');
         }

         function changeActive(section) {
           if (section.hasClass('nav-primary_button')) {
             // toggle a clicked state on the trigger
             $(this).toggleClass('nav-primary_button-clicked');
             // show the overlay
             showOverlay();
           } else {
             section.addClass('nav-primary_section-active');
             section.siblings('.nav-primary_section').removeClass('nav-primary_section-active');
             if ( $(window).width() < 740 ) {
               section.siblings('.nav-primary_section').addClass('is-hidden');
             }
           }
         }

         // Handling for click events. When someone clicks the nav, the mobile nav button, or anywhere
         // on the page if the menu is already open:

         $(document).on('touchstart click', '.body-nav-primary-open, .nav-primary_section, .nav-primary_button', function(e) {
           e.stopPropagation();
           e.preventDefault();

           // is this the mobile button?
           if ($(this).hasClass('nav-primary_button')) {
             // is the menu already open?
             if ($('body').hasClass('body-nav-primary-open')) {
               closeMenu();
               closeOverlay();
             } else {
               showMenu();
               showOverlay();
               closeSearch();
             }
           }
           // is this the nav?
           else if ($(this).hasClass('nav-primary_section')) {
             // is this the active item?
             if ($(this).hasClass('nav-primary_section-active')) {
               if ( $(window).width() < 740 ) {
                 removeActive();
               } else {
                 closeMenu();
                 closeOverlay();
                 removeActive();
               }
             } else {
               if (!$('body').hasClass('body-nav-primary-open')) {
                 showMenu();
                 showOverlay();
                 closeSearch();
               }
               changeActive($(this));
             }
           }
           // is this some other part of the document (clicking outside the nav)?
           else {
             closeMenu();
             closeOverlay();
             removeActive();
           }
         });

       })(jQuery);
     }
   };
 })(jQuery, Drupal);

/**
 * @file
 * Jump nav behaviors for article pages.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.jumpNav = {
     attach: function (context, settings) {
       (function ($) {

         //check if a jump nav exists and is visible on the page
         //otherwise we shouldn't do any of this
         if ($('.jumpnav-content').length > 0 &&
         $('.article-body').length > 0 &&
         $('.jump-nav_list li').children().length > 0) {
           initializeJumpNav();
         }

         function initializeJumpNav(){
           // When a user clicks on the ribbon trigger (main)
           $('.jump-nav_title').click(function() {
             // Unfocus on the dropdown
             $(this).blur();
             // add a class to the parent
             $(this).parents('#jump-nav').toggleClass('is-closed');
           });

           // When a user clicks on a title link, close dropdown
           $('.jump-nav_list-item a').click(function() {
             // add a class to the parent
             $('#jump-nav').toggleClass('is-closed');
           });


           // On page scroll
           $(window).scroll(function() {
             var doc = $(document);
             var windowTop = $(window).scrollTop();
             var divTop = $('.jumpnav-anchor').offset().top;
             var body = doc.find('.article-body');
             var content = doc.find('.jumpnav-content');
             var stickyBottom = content.offset().top + content.height();
             var bodyBottom = body.offset().top + body.height();

             // Trigger fixed class
             if (windowTop > divTop) {
               $('#jump-nav').addClass('fixed');
             } else {
               $('#jump-nav').removeClass('fixed');
             }

             // Show / hide jump nav
             if(stickyBottom > bodyBottom) {
               content.hide();
             } else {
               content.fadeIn(250);
             }
           });


           // Animate scroll on jump nav click
           $('.jump-nav_list a').click(function(e) {
             var jumpobj = $(this);
             var target = jumpobj.attr('href');
             var thespeed = 500;
             var offset = $(target).offset().top - 100;
             e.preventDefault();

             $('html,body').animate({
               scrollTop: offset
             }, thespeed);
           });


           var aChildren = $('.jump-nav_list li').children(); // find the a children of the list items
           var aArray = []; // create the empty aArray
           for (var i=0; i < aChildren.length; i++) {
             var aChild = aChildren[i];
             var ahref = $(aChild).attr('href');
             aArray.push(ahref);
           }

           // Trigger is-active class when user scrolls into each section
           $(window).scroll(function() {
             var windowPos = $(window).scrollTop() + 105; // get the offset of the window from the top of page
             var windowHeight = $(window).height(); // get the height of the window
             var docHeight = $(document).height();

             for (var i=0; i < aArray.length; i++) {
               var theID = aArray[i];
               var divPos = $(theID).offset().top; // get the offset of the div from the top of page
               var divHeight = $(theID).height(); // get the height of the div in question
               if (windowPos >= divPos && windowPos < (divPos + divHeight)) {
                 $('a[href="' + theID + '"]').parent("li").addClass('is-active');
               } else {
                 $('a[href="' + theID + '"]').parent("li").removeClass('is-active');
               }
             }

             if(windowPos + windowHeight == docHeight) {
               if (!$('.jump-nav_list li:last-child').hasClass('is-active')) {
                 var navActiveCurrent = $('.is-active').attr('href');
                 $('a[href="' + navActiveCurrent + '"]').parent("li").removeClass('is-active');
                 $('.jump-nav_list li:last-child').addClass('is-active');
               }
             }
           });
         }

       })(jQuery);
     }
   };
 })(jQuery, Drupal);

/**
 * @file
 * Behavior for tabs on homepage audience selector.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.tabsAudienceSelector = {
     attach: function (context, settings) {
       (function ($) {

         var bp_med = 900; // 900px = $bp-med css variable

         // checkWidth function
         function checkWidth() {
           if (($(window).width() >= bp_med)) {
             // Show all li selectors
             $('.tabs-audience_selector_list > li').css('display', 'inline-block');
           }
           else {
             // Display list-item for all li selectors
             $('.tabs-audience_selector_list > li').css('display', 'list-item');
             // Hide all li selectors expect first one
             $('.tabs-audience_selector_list > li:gt(0)').hide();
           }
         }

         // Run checkWidth
         checkWidth();
         // Re-run checkWidth on window resize
         $(window).resize(checkWidth);

         // Mobile Audience Selector tabs
         $('.tabs-audience_selector_list').click(function () {
           // If viewport is smaller than 900px
           if (($(window).width() < bp_med)) {
             // Add the active class to the list when it is clicked
             $(this).toggleClass('open');
             // Toggle hidden items on click
             $(this).children('li:gt(0)').slideToggle();
           }
         });

       })(jQuery);
     }
   };
 })(jQuery, Drupal);

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

/**
 * @file
 * Behaviors for the homepage featured content block.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.featuredContent = {
     attach: function (context, settings) {
       (function ($) {

         // Hide items except first 3
         $('.audience_featured-hero_item').each(function() {
           $(this).find('.list_featured_content-item:gt(2)').addClass('hidden').hide();
         });

         // Create a toggle between Load more and less
         $('.link_load_more_less a').on('click', function() {

           // Featured content path variable
           var featuredContent = '.audience_featured-hero_item.active .list_featured_content-item';
           var featuredContentShown = $(featuredContent+'.shown');
           var featuredContentHidden = $(featuredContent+'.hidden');

           // If featured content has show class do this
           if($(featuredContent).hasClass('hidden')) {

             // Updated link text and icon
             $(this).contents().first()[0].textContent='Load less ';
             $(this).children('.icon').removeClass('icon-viewmore').addClass('icon-viewless');

             // Slide open hidden content on click
             featuredContentHidden.each(function() {
               $(this).removeClass('hidden').addClass('shown');
               $(this).slideDown(300);
             });
           }

           // If featured content has hide class do this
           else if($(featuredContent).hasClass('shown')) {

             // Updated link text and icon
             $(this).contents().first()[0].textContent='Load more ';
             $(this).children('.icon').removeClass('icon-viewless').addClass('icon-viewmore');

             // Slide close hidden content on click
             featuredContentShown.each(function() {
               $(this).removeClass('shown').addClass('hidden');
               $(this).slideUp(300);
             });
           };

         });

         // Audience tab interaction
         $('.tabs-audience_selector_list_item a').click(function() {

           // Tab data variable
           var tab_id = $(this).attr('data-tab');

           // Remove classes
           $('.tabs-audience_selector_list_item a').removeClass('active');
           $('.audience_featured-hero_item').removeClass('active');

           // Add classes
           $(this).addClass('active');
           $('#'+tab_id).addClass('active');
         });

       })(jQuery);
     }
   };
 })(jQuery, Drupal);

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

/**
 * @file
 * Responsive behaviors for EC Tabs Course Browser.
 *
 * JavaScript should be made compatible with libraries other than jQuery by
 * wrapping it with an "anonymous closure". See:
 * - https://drupal.org/node/1446420
 * - http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
 (function ($, Drupal) {
   Drupal.behaviors.ecTabsCourseBrowser = {
     attach: function (context, settings) {
       (function ($) {

         var bp_med = 900; // 900px = $bp-med css variable

         // checkWidth function
         function checkWidth() {
           if (($(window).width() >= bp_med)) {
             // Show all li selectors
             $('.tabs-course_browser_list-tabs > li').css('display', 'inline-block');
           }
           else {
             // Display list-item for all li selectors
             $('.tabs-course_browser_list-tabs > li').css('display', 'list-item');
             // Hide all li selectors expect first one
             $('.tabs-course_browser_list-tabs > li:gt(0)').hide();
           }
         }

         // Run checkWidth
         checkWidth();
         // Re-run checkWidth on window resize
         $(window).resize(checkWidth);

         // Mobile Course Browser tabs
         $('.tabs-course_browser_list-tabs').click(function () {
           // If viewport is smaller than 900px
           if (($(window).width() < bp_med)) {
             // Add the active class to the list when it is clicked
             $(this).toggleClass('open');
             // Toggle hidden items on click
             $(this).children('li:gt(0)').slideToggle();
           }
         });

       })(jQuery);
     }
   };
 })(jQuery, Drupal);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpdHZpZHMuanMiLCJmb3JtLWl0ZW1zLmpzIiwiaHViLWN0YS1oYWxmLXZpZGVvLmpzIiwibmF2LmpzIiwiMDAtYXRvbXMvMDYtYnV0dG9ucy8wMS1idXR0b24tc2VhcmNoL3NlYXJjaC1tb2RhbC5qcyIsIjAxLW1vbGVjdWxlcy8wNC1mb3Jtcy8wMC1zZWFyY2gtZmllbGQvc2VhcmNoLmpzIiwiMDEtbW9sZWN1bGVzLzA1LW5hdmlnYXRpb24vMDAtcHJpbWFyeS1uYXYvcHJpbWFyeS1uYXYuanMiLCIwMS1tb2xlY3VsZXMvMDUtbmF2aWdhdGlvbi8wMS1qdW1wLW5hdi9qdW1wLW5hdi5qcyIsIjAxLW1vbGVjdWxlcy8wNS1uYXZpZ2F0aW9uLzA2LXRhYnMtYXVkaWVuY2Utc2VsZWN0b3IvdGFicy1hdWRpZW5jZS1zZWxlY3Rvci5qcyIsIjAxLW1vbGVjdWxlcy8wNi1jb21wb25lbnRzLzEzLWFjY29yZGlvbi9hY2NvcmRpb24uanMiLCIwMS1tb2xlY3VsZXMvMDgtbGlzdHMvMDYtbGlzdC1mZWF0dXJlZC1jb250ZW50LWhlcm8vZmVhdHVyZWQtY29udGVudC5qcyIsIjAxLW1vbGVjdWxlcy8xMS1hY2NvdW50LW1nbXQtY2VudGVyLzAxLWJsb2NrLXNlbGVjdC9ibG9jay1zZWxlY3QuanMiLCIwMi1vcmdhbmlzbXMvMDAtZ2xvYmFsLzAwLWhlYWRlci1wcmltYXJ5L2hlYWRlci1wcmltYXJ5LmpzIiwiMDItb3JnYW5pc21zLzA1LWVjLzAzLWVjLXRhYnMtY291cnNlLWJyb3dzZXIvZWMtdGFicy1jb3Vyc2UtYnJvd3Nlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZHJ1cGFsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypnbG9iYWwgalF1ZXJ5ICovXG4vKiFcbiogRml0VmlkcyAxLjBcbipcbiogQ29weXJpZ2h0IDIwMTEsIENocmlzIENveWllciAtIGh0dHA6Ly9jc3MtdHJpY2tzLmNvbSArIERhdmUgUnVwZXJ0IC0gaHR0cDovL2RhdmVydXBlcnQuY29tXG4qIENyZWRpdCB0byBUaGllcnJ5IEtvYmxlbnR6IC0gaHR0cDovL3d3dy5hbGlzdGFwYXJ0LmNvbS9hcnRpY2xlcy9jcmVhdGluZy1pbnRyaW5zaWMtcmF0aW9zLWZvci12aWRlby9cbiogUmVsZWFzZWQgdW5kZXIgdGhlIFdURlBMIGxpY2Vuc2UgLSBodHRwOi8vc2FtLnpveS5vcmcvd3RmcGwvXG4qXG4qIERhdGU6IFRodSBTZXB0IDAxIDE4OjAwOjAwIDIwMTEgLTA1MDBcbiovXG5cbihmdW5jdGlvbiggJCApe1xuXG4gICQuZm4uZml0VmlkcyA9IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuICAgIHZhciBzZXR0aW5ncyA9IHtcbiAgICAgIGN1c3RvbVNlbGVjdG9yOiBudWxsXG4gICAgfVxuXG4gICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuICAgICAgICByZWYgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYmFzZScpWzBdIHx8IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKVswXTtcblxuICAgIGRpdi5jbGFzc05hbWUgPSAnZml0LXZpZHMtc3R5bGUnO1xuICAgIGRpdi5pbm5lckhUTUwgPSAnJnNoeTs8c3R5bGU+ICAgICAgICAgXFxcbiAgICAgIC5mbHVpZC13aWR0aC12aWRlby13cmFwcGVyIHsgICAgICAgIFxcXG4gICAgICAgICB3aWR0aDogMTAwJTsgICAgICAgICAgICAgICAgICAgICBcXFxuICAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlOyAgICAgICAgICAgICAgXFxcbiAgICAgICAgIHBhZGRpbmc6IDA7ICAgICAgICAgICAgICAgICAgICAgIFxcXG4gICAgICB9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxcbiAgICAgIC5mbHVpZC13aWR0aC12aWRlby13cmFwcGVyIGlmcmFtZSwgIFxcXG4gICAgICAuZmx1aWQtd2lkdGgtdmlkZW8td3JhcHBlciBvYmplY3QsICBcXFxuICAgICAgLmZsdWlkLXdpZHRoLXZpZGVvLXdyYXBwZXIgZW1iZWQgeyAgXFxcbiAgICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTsgICAgICAgICAgICAgIFxcXG4gICAgICAgICB0b3A6IDA7ICAgICAgICAgICAgICAgICAgICAgICAgICBcXFxuICAgICAgICAgbGVmdDogMDsgICAgICAgICAgICAgICAgICAgICAgICAgXFxcbiAgICAgICAgIHdpZHRoOiAxMDAlOyAgICAgICAgICAgICAgICAgICAgIFxcXG4gICAgICAgICBoZWlnaHQ6IDEwMCU7ICAgICAgICAgICAgICAgICAgICBcXFxuICAgICAgfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXFxcbiAgICA8L3N0eWxlPic7XG5cbiAgICByZWYucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZGl2LHJlZik7XG5cbiAgICBpZiAoIG9wdGlvbnMgKSB7XG4gICAgICAkLmV4dGVuZCggc2V0dGluZ3MsIG9wdGlvbnMgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgc2VsZWN0b3JzID0gW1xuICAgICAgICBcImlmcmFtZVtzcmMqPSdwbGF5ZXIudmltZW8uY29tJ11cIixcbiAgICAgICAgXCJpZnJhbWVbc3JjKj0nd3d3LnlvdXR1YmUuY29tJ11cIixcbiAgICAgICAgXCJpZnJhbWVbc3JjKj0nd3d3LmtpY2tzdGFydGVyLmNvbSddXCIsXG4gICAgICAgIFwib2JqZWN0XCIsXG4gICAgICAgIFwiZW1iZWRcIlxuICAgICAgXTtcblxuICAgICAgaWYgKHNldHRpbmdzLmN1c3RvbVNlbGVjdG9yKSB7XG4gICAgICAgIHNlbGVjdG9ycy5wdXNoKHNldHRpbmdzLmN1c3RvbVNlbGVjdG9yKTtcbiAgICAgIH1cblxuICAgICAgdmFyICRhbGxWaWRlb3MgPSAkKHRoaXMpLmZpbmQoc2VsZWN0b3JzLmpvaW4oJywnKSk7XG5cbiAgICAgICRhbGxWaWRlb3MuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgICAgICBpZiAodGhpcy50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT0gJ2VtYmVkJyAmJiAkdGhpcy5wYXJlbnQoJ29iamVjdCcpLmxlbmd0aCB8fCAkdGhpcy5wYXJlbnQoJy5mbHVpZC13aWR0aC12aWRlby13cmFwcGVyJykubGVuZ3RoKSB7IHJldHVybjsgfVxuICAgICAgICB2YXIgaGVpZ2h0ID0gKCB0aGlzLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PSAnb2JqZWN0JyB8fCAkdGhpcy5hdHRyKCdoZWlnaHQnKSApID8gJHRoaXMuYXR0cignaGVpZ2h0JykgOiAkdGhpcy5oZWlnaHQoKSxcbiAgICAgICAgICAgIHdpZHRoID0gJHRoaXMuYXR0cignd2lkdGgnKSA/ICR0aGlzLmF0dHIoJ3dpZHRoJykgOiAkdGhpcy53aWR0aCgpLFxuICAgICAgICAgICAgYXNwZWN0UmF0aW8gPSBoZWlnaHQgLyB3aWR0aDtcbiAgICAgICAgaWYoISR0aGlzLmF0dHIoJ2lkJykpe1xuICAgICAgICAgIHZhciB2aWRlb0lEID0gJ2ZpdHZpZCcgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqOTk5OTk5KTtcbiAgICAgICAgICAkdGhpcy5hdHRyKCdpZCcsIHZpZGVvSUQpO1xuICAgICAgICB9XG4gICAgICAgICR0aGlzLndyYXAoJzxkaXYgY2xhc3M9XCJmbHVpZC13aWR0aC12aWRlby13cmFwcGVyXCI+PC9kaXY+JykucGFyZW50KCcuZmx1aWQtd2lkdGgtdmlkZW8td3JhcHBlcicpLmNzcygncGFkZGluZy10b3AnLCAoYXNwZWN0UmF0aW8gKiAxMDApK1wiJVwiKTtcbiAgICAgICAgJHRoaXMucmVtb3ZlQXR0cignaGVpZ2h0JykucmVtb3ZlQXR0cignd2lkdGgnKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59KSggalF1ZXJ5ICk7IiwiLyoqXG4gKiBAZmlsZVxuICogSW50ZXJhY3Rpb25zIGZvciBmb3JtIHZhbGlkYXRpb24uXG4gKiBSZWZlcmVuY2UgaHR0cDovL2NvZGVwZW4uaW8vYW5vbi9wZW4vR0hLSmpcbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuXG4oZnVuY3Rpb24gKCQsIERydXBhbCkge1xuICBEcnVwYWwuYmVoYXZpb3JzLmZvcm1pdGVtcyA9IHtcbiAgICBhdHRhY2g6IGZ1bmN0aW9uIChjb250ZXh0LCBzZXR0aW5ncykge1xuICAgICAgKGZ1bmN0aW9uICgkKSB7XG5cbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgICAgICAvLyBWYWxpZGF0ZSBmb3JtXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICAvLyBWYWxpZGF0ZSBvbiBwYWdlIGxvYWRcbiAgICAgICAgJCgnLnNpbXBsZS1zdGVwLWZvcm0sIC5tdWx0aS1zdGVwLWZvcm0nKS52YWxpZGF0ZSh7XG4gICAgICAgICAgcnVsZXM6IHtcbiAgICAgICAgICAgIHRlbDoge1xuICAgICAgICAgICAgICBudW1iZXI6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIGlnbm9yZTogJzpoaWRkZW4nXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIE11bHRpIHN0ZXAgZm9ybSBuZXh0IGxpbmtcbiAgICAgICAgJCgnLnN0ZXAtZm9ybS1uZXh0JykuY2xpY2soZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAvLyBGaWVsZHNldCB2YXJpYWJsZXNcbiAgICAgICAgICB2YXIgY3VycmVudF9mcyA9ICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKTtcbiAgICAgICAgICB2YXIgbmV4dF9mcyA9ICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKS5uZXh0KCdmaWVsZHNldCcpO1xuICAgICAgICAgIHZhciBwcmV2X2ZzID0gJCh0aGlzKS5jbG9zZXN0KCdmaWVsZHNldCcpLnByZXZBbGwoJ2ZpZWxkc2V0Jyk7XG5cbiAgICAgICAgICAvLyBJZiBjdXJyZW50IGZpZWxkc2V0IGlzIHZhbGlkIGdvIHRvIG5leHQgZmllbGRzZXRcbiAgICAgICAgICBpZigkKCcubXVsdGktc3RlcC1mb3JtJykudmFsaWQoKSkge1xuICAgICAgICAgICAgY3VycmVudF9mcy5yZW1vdmVDbGFzcygnYWN0aXZlJykuYWRkQ2xhc3MoJ2NvbXBsZXRlJyk7XG4gICAgICAgICAgICBuZXh0X2ZzLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIHByZXZfZnMuYWRkQ2xhc3MoJ2NvbXBsZXRlJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBTdGVwIGFuY2hvciBsaW5rc1xuICAgICAgICAkKCcuc3RlcC1mb3JtLWFuY2hvcicpLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgLy8gRmllbGRzZXQgdmFyaWFibGVcbiAgICAgICAgICB2YXIgY3VycmVudF9mcyA9ICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKTtcblxuICAgICAgICAgIC8vIElmIGN1cnJlbnQgZmllbGRzZXQgaGFzIGNsYXNzIGRvIHRoaXNcbiAgICAgICAgICBpZihjdXJyZW50X2ZzLmhhc0NsYXNzKCdjb21wbGV0ZScpKSB7XG4gICAgICAgICAgICBjdXJyZW50X2ZzLnJlbW92ZUNsYXNzKCdjb21wbGV0ZScpLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIGN1cnJlbnRfZnMuc2libGluZ3MoJ2ZpZWxkc2V0JykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cblxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgIC8vIEluaXRpYXRlIGZvcm0gaWNvbnNcbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgIC8vIENyZWF0ZSB2YXJpYWJsZSBmb3IgYWxsIHNlbGVjdG9ycyBuZWVkZWQgZm9yIGljb24gdmFsaWRhdG9yXG4gICAgICAgIHZhciBpY29uU2VsZWN0b3IgPSAkKCcuZm9ybS1pdGVtIGlucHV0W3R5cGU9XCJ0ZXh0XCJdLCAuZm9ybS1pdGVtIGlucHV0W3R5cGU9XCJlbWFpbFwiXSwgLmZvcm0taXRlbSBpbnB1dFt0eXBlPVwidXJsXCJdLCAuZm9ybS1pdGVtIGlucHV0W3R5cGU9XCJkYXRlXCJdLCAuZm9ybS1pdGVtIGlucHV0W3R5cGU9XCJtb250aFwiXSwgLmZvcm0taXRlbSBpbnB1dFt0eXBlPVwidGltZVwiXSwgLmZvcm0taXRlbSBpbnB1dFt0eXBlPVwiZGF0ZXRpbWVcIl0sIC5mb3JtLWl0ZW0gaW5wdXRbdHlwZT1cImRhdGV0aW1lLWxvY2FsXCJdLCAuZm9ybS1pdGVtIGlucHV0W3R5cGU9XCJ3ZWVrXCJdLCAuZm9ybS1pdGVtIGlucHV0W3R5cGU9XCJudW1iZXJcIl0sIC5mb3JtLWl0ZW0gaW5wdXRbdHlwZT1cInNlYXJjaFwiXSwgLmZvcm0taXRlbSBpbnB1dFt0eXBlPVwidGVsXCJdLCAuZm9ybS1pdGVtIGlucHV0W3R5cGU9XCJjb2xvclwiXSwgLmZvcm0taXRlbSBzZWxlY3QsIC5mb3JtLWl0ZW0gdGV4dGFyZWEsIC5mb3JtLWl0ZW0tcmFkaW8gbGFiZWwuZXJyb3IsIC5mb3JtLWl0ZW0tcmFkaW8tbGFiZWxfZ3JvdXAgbGFiZWw6bGFzdC1jaGlsZCwgLmZvcm0taXRlbS1jaGVja2JveCBsYWJlbC5lcnJvcicpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBmb3JtIGl0ZW0gaWNvblxuICAgICAgICAkKGljb25TZWxlY3RvcikuYWZ0ZXIoJzxzcGFuIGNsYXNzPVwiZm9ybS1pdGVtX2ljb25cIj48L3NwYW4+Jyk7XG5cblxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgIC8vIEluaXRpYXRlIGxhYmVsIHNob3cvaGlkZVxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgIHZhciBvbkNsYXNzID0gJ29uJztcbiAgICAgICAgdmFyIHNob3dDbGFzcyA9ICdzaG93JztcblxuICAgICAgICAkKCdpbnB1dCwgdGV4dGFyZWEsIHNlbGVjdCcpXG4gICAgICAgIC5iaW5kKCdjaGVja3ZhbCcsIGZ1bmN0aW9uKClcbiAgICAgICAge1xuICAgICAgICAgIHZhciBsYWJlbCA9ICQodGhpcykucHJldignbGFiZWwnKTtcblxuICAgICAgICAgIGlmICh0aGlzLnZhbHVlICE9PSAnJylcbiAgICAgICAgICBsYWJlbC5hZGRDbGFzcyhzaG93Q2xhc3MpO1xuXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIGxhYmVsLnJlbW92ZUNsYXNzKHNob3dDbGFzcyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbigna2V5dXAnLCBmdW5jdGlvbigpXG4gICAgICAgIHtcbiAgICAgICAgICAkKHRoaXMpLnRyaWdnZXIoJ2NoZWNrdmFsJyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignZm9jdXMnLCBmdW5jdGlvbigpXG4gICAgICAgIHtcbiAgICAgICAgICAkKHRoaXMpLnByZXYoJ2xhYmVsJykuYWRkQ2xhc3Mob25DbGFzcyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignYmx1cicsIGZ1bmN0aW9uKClcbiAgICAgICAge1xuICAgICAgICAgICQodGhpcykucHJldignbGFiZWwnKS5yZW1vdmVDbGFzcyhvbkNsYXNzKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRyaWdnZXIoJ2NoZWNrdmFsJyk7XG5cbiAgICAgICAgJCgnc2VsZWN0JylcbiAgICAgICAgLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbigpXG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuXG4gICAgICAgICAgaWYgKCR0aGlzLnZhbCgpID09ICcnKVxuICAgICAgICAgICR0aGlzLmFkZENsYXNzKCd3YXRlcm1hcmsnKTtcblxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAkdGhpcy5yZW1vdmVDbGFzcygnd2F0ZXJtYXJrJyk7XG5cbiAgICAgICAgICAkdGhpcy50cmlnZ2VyKCdjaGVja3ZhbCcpO1xuICAgICAgICB9KVxuICAgICAgICAuY2hhbmdlKCk7XG5cblxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgIC8vIFNob3cgLyBIaWRlIHBhc3N3b3JkIHRleHRcbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgICQoJy5mb3JtLWl0ZW1fcGFzc3dvcmQnKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKCdzaG93Jyk7XG5cbiAgICAgICAgICBpZigkKHRoaXMpLmhhc0NsYXNzKCdzaG93JykpIHtcbiAgICAgICAgICAgICQodGhpcykuc2libGluZ3MoJ2lucHV0JykuYXR0cigndHlwZScsICd0ZXh0Jyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgJCh0aGlzKS5zaWJsaW5ncygnaW5wdXQnKS5hdHRyKCd0eXBlJywgJ3Bhc3N3b3JkJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgfSkoalF1ZXJ5KTtcbiAgICB9XG4gIH07XG59KShqUXVlcnksIERydXBhbCk7XG4iLCIvKipcbiAqIEBmaWxlXG4gKiBJbml0aWFsaXplIGZpdFZpZCBmb3IgWW91VHViZSB2aWVvcy5cbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuIChmdW5jdGlvbiAoJCwgRHJ1cGFsKSB7XG4gICBEcnVwYWwuYmVoYXZpb3JzLmZpdHZpZGluaXQgPSB7XG4gICAgIGF0dGFjaDogZnVuY3Rpb24gKGNvbnRleHQsIHNldHRpbmdzKSB7XG4gICAgICAgKGZ1bmN0aW9uICgkKSB7XG5cbiAgICAgICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICQoJ2lmcmFtZVtzcmMqPVwieW91dHViZVwiXScpLnBhcmVudCgpLmZpdFZpZHMoKTtcbiAgICAgICAgIH0pO1xuXG4gICAgICAgfSkoalF1ZXJ5KTtcbiAgICAgfVxuICAgfTtcbiB9KShqUXVlcnksIERydXBhbCk7XG4iLCIvKipcbiAqIEBmaWxlXG4gKiBSaWJib24gbmF2IHVzZXIgaW50ZXJhY3Rpb25zLlxuICpcbiAqIEphdmFTY3JpcHQgc2hvdWxkIGJlIG1hZGUgY29tcGF0aWJsZSB3aXRoIGxpYnJhcmllcyBvdGhlciB0aGFuIGpRdWVyeSBieVxuICogd3JhcHBpbmcgaXQgd2l0aCBhbiBcImFub255bW91cyBjbG9zdXJlXCIuIFNlZTpcbiAqIC0gaHR0cHM6Ly9kcnVwYWwub3JnL25vZGUvMTQ0NjQyMFxuICogLSBodHRwOi8vd3d3LmFkZXF1YXRlbHlnb29kLmNvbS8yMDEwLzMvSmF2YVNjcmlwdC1Nb2R1bGUtUGF0dGVybi1Jbi1EZXB0aFxuICovXG4gKGZ1bmN0aW9uICgkLCBEcnVwYWwpIHtcbiAgIERydXBhbC5iZWhhdmlvcnMucmliYm9ubmF2ID0ge1xuICAgICBhdHRhY2g6IGZ1bmN0aW9uIChjb250ZXh0LCBzZXR0aW5ncykge1xuICAgICAgIChmdW5jdGlvbiAoJCkge1xuXG4gICAgICAgICAvLyBTZWFyY2hcblxuICAgICAgICAgLy8gV2hlbiBhIHVzZXIgY2xpY2tzIG9uIHRoZSByaWJib24gdHJpZ2dlciAobWFpbilcbiAgICAgICAgICQoJy5yaWJib25fZHJvcGRvd25fdHJpZ2dlcicpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAvLyBVbmZvY3VzIG9uIHRoZSBkcm9wZG93blxuICAgICAgICAgICAkKHRoaXMpLmJsdXIoKTtcbiAgICAgICAgICAgLy8gYWRkIGEgY2xhc3MgdG8gdGhlIHNpYmxpbmcgZHJvcGRvd25cbiAgICAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQodGhpcykuc2libGluZ3MoJy5yaWJib25fZHJvcGRvd25fbmF2JykudG9nZ2xlQ2xhc3MoJ2lzLWFjdGl2ZScpLnNsaWRlVG9nZ2xlKDMwMCk7XG4gICAgICAgICAgICQoJy5yaWJib25fdXNlci1tZW51X3RyaWdnZXInKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQoJy5yaWJib25fdXNlci1tZW51X25hdicpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKS5zbGlkZVVwKDMwMCk7O1xuICAgICAgICAgICAkKCcucmliYm9uX3VzZXItbWVudV90cmlnZ2VyLWF1dGgnKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQoJy5yaWJib25fdXNlci1tZW51X25hdi1jaGlsZCcpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKS5zbGlkZVVwKDMwMCk7XG4gICAgICAgICB9KTtcblxuICAgICAgICAgLy8gV2hlbiBhIHVzZXIgY2xpY2tzIG9uIHRoZSByaWJib24gdHJpZ2dlciBmb3IgdXNlciBkcm9wZG93blxuICAgICAgICAgJCgnLnJpYmJvbl91c2VyLW1lbnVfdHJpZ2dlcicpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAvLyBVbmZvY3VzIG9uIHRoZSBkcm9wZG93blxuICAgICAgICAgICAkKHRoaXMpLmJsdXIoKTtcbiAgICAgICAgICAgLy8gYWRkIGEgY2xhc3MgdG8gdGhlIHNpYmxpbmcgZHJvcGRvd25cbiAgICAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQodGhpcykuc2libGluZ3MoJy5yaWJib25fdXNlci1tZW51X25hdicpLnRvZ2dsZUNsYXNzKCdpcy1hY3RpdmUnKS5zbGlkZVRvZ2dsZSgzMDApO1xuICAgICAgICAgICAkKCcucmliYm9uX2Ryb3Bkb3duX3RyaWdnZXInKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQoJy5yaWJib25fZHJvcGRvd25fbmF2JykucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpLnNsaWRlVXAoMzAwKTtcbiAgICAgICAgIH0pO1xuXG4gICAgICAgICAvLyBXaGVuIGEgdXNlciBjbGlja3Mgb24gdGhlIHJpYmJvbiB0cmlnZ2VyIGZvciBhdXRoZW50aWNhdGVkIHVzZXIgZHJvcGRvd25cbiAgICAgICAgICQoJy5yaWJib25fdXNlci1tZW51X3RyaWdnZXItYXV0aCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAvLyBVbmZvY3VzIG9uIHRoZSBkcm9wZG93blxuICAgICAgICAgICAkKHRoaXMpLmJsdXIoKTtcbiAgICAgICAgICAgLy8gYWRkIGEgY2xhc3MgdG8gdGhlIHNpYmxpbmcgZHJvcGRvd25cbiAgICAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQodGhpcykuc2libGluZ3MoJy5yaWJib25fdXNlci1tZW51X25hdi1jaGlsZCcpLnRvZ2dsZUNsYXNzKCdpcy1hY3RpdmUnKS5zbGlkZVRvZ2dsZSgzMDApO1xuICAgICAgICAgICAkKCcucmliYm9uX2Ryb3Bkb3duX3RyaWdnZXInKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQoJy5yaWJib25fZHJvcGRvd25fbmF2JykucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpLnNsaWRlVXAoMzAwKTtcbiAgICAgICAgIH0pO1xuXG4gICAgICAgfSkoalF1ZXJ5KTtcbiAgICAgfVxuICAgfTtcbiB9KShqUXVlcnksIERydXBhbCk7XG4iLCIvKipcbiAqIEBmaWxlXG4gKiBUcmlnZXIgb3ZlcmxheSB3aGVuIHNlYXJjaCBib3ggaXMgdXNlZC5cbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuIChmdW5jdGlvbiAoJCwgRHJ1cGFsKSB7XG4gICBEcnVwYWwuYmVoYXZpb3JzLnNlYXJjaE1vZGFsID0ge1xuICAgICBhdHRhY2g6IGZ1bmN0aW9uIChjb250ZXh0LCBzZXR0aW5ncykge1xuICAgICAgIChmdW5jdGlvbiAoJCkge1xuXG4gICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50cyBvbiBzZWFyY2ggYnV0dG9uIGNsaWNrXG4gICAgICAgICAkKCcuYnV0dG9uLXNlYXJjaCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgIC8vIFJlbW92ZSBjbGFzc2VzIGZvciBuYXYgZHJvcGRvd25zXG4gICAgICAgICAgICQoJy5uYXYtcHJpbWFyeV9zZWN0aW9uLCAubmF2LXByaW1hcnlfc2VjdGlvbicpLnJlbW92ZUNsYXNzKCduYXYtcHJpbWFyeV9zZWN0aW9uLWFjdGl2ZSwgbmF2LXByaW1hcnlfc2VjdGlvbi1hY3RpdmUnKTtcbiAgICAgICAgICAgJCgnLm5hdi1wcmltYXJ5X3NlY3Rpb25fc3VibmF2JykucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcblxuICAgICAgICAgICAvLyBJZiBpcy1vcGVuIGNsYXNzIGV4aXN0c1xuICAgICAgICAgICBpZiggJCgnLnNlYXJjaF9tb2RhbCcpLmhhc0NsYXNzKCdpcy1vcGVuJykgKSB7XG4gICAgICAgICAgICAgJCgnLnNlYXJjaF9tb2RhbCcpLnJlbW92ZUNsYXNzKCdpcy1vcGVuJyk7XG4gICAgICAgICAgICAgJCgnLm5hdi1wcmltYXJ5X292ZXJsYXktbW9iaWxlJykucmVtb3ZlQ2xhc3MoJ25hdi1wcmltYXJ5X292ZXJsYXktbW9iaWxlLW9uJyk7XG4gICAgICAgICAgIH1cblxuICAgICAgICAgICAvLyBJZiBpcy1vcGVuIGNsYXNzIGRvZXNuJ3QgZXhpc3RcbiAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgJCgnLnNlYXJjaF9tb2RhbCcpLmFkZENsYXNzKCdpcy1vcGVuJyk7XG4gICAgICAgICAgICAgJCgnLm5hdi1wcmltYXJ5X292ZXJsYXktbW9iaWxlJykuYWRkQ2xhc3MoJ25hdi1wcmltYXJ5X292ZXJsYXktbW9iaWxlLW9uJyk7XG5cbiAgICAgICAgICAgICAvLyBGb2N1cyBzZWFyY2ggaW5wdXRcbiAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAkKCcuc2VhcmNoX21vZGFsIC5zZWFyY2gtZmllbGRfaW5wdXQnKS5mb2N1cygpO1xuICAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgICAgIH07XG5cbiAgICAgICAgICAgLy8gUmVtb3ZlIG5hdiBwcmltYXJ5IGxpc3Qgb3BlbiBjbGFzcyBhbmQgYWRkIGNsb3NlZCBjbGFzcyBvbiBzZWFyY2ggYnV0dG9uIGNsaWNrXG4gICAgICAgICAgIGlmICggJCh3aW5kb3cpLndpZHRoKCkgPCA3NDAgKSB7XG4gICAgICAgICAgICAgJCgnLm5hdi1wcmltYXJ5X2xpc3QnKS5yZW1vdmVDbGFzcygnbmF2LXByaW1hcnlfbGlzdC1tb2JpbGUtb3BlbicpLmFkZENsYXNzKCduYXYtcHJpbWFyeV9saXN0LW1vYmlsZS1jbG9zZWQnKTtcbiAgICAgICAgICAgfTtcbiAgICAgICAgIH0pO1xuXG4gICAgICAgICAvLyBSZW1vdmUgY2xhc3NlcyB3aGVuIGNsaWNraW5nIGNsb3NlXG4gICAgICAgICAkKCcuc2VhcmNoX21vZGFsX2Nsb3NlJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICQoJy5zZWFyY2hfbW9kYWwnKS5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xuICAgICAgICAgICAkKCcubmF2LXByaW1hcnlfb3ZlcmxheS1tb2JpbGUnKS5yZW1vdmVDbGFzcygnbmF2LXByaW1hcnlfb3ZlcmxheS1tb2JpbGUtb24nKTtcbiAgICAgICAgIH0pO1xuXG4gICAgICAgfSkoalF1ZXJ5KTtcbiAgICAgfVxuICAgfTtcbiB9KShqUXVlcnksIERydXBhbCk7XG4iLCIvKipcbiAqIEBmaWxlXG4gKiBJbnRlcmFjdGlvbnMgZm9yIHNlYXJjaCBmaWVsZC5cbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuIChmdW5jdGlvbiAoJCwgRHJ1cGFsKSB7XG4gICBEcnVwYWwuYmVoYXZpb3JzLnNlYXJjaEZpZWxkID0ge1xuICAgICBhdHRhY2g6IGZ1bmN0aW9uIChjb250ZXh0LCBzZXR0aW5ncykge1xuICAgICAgIChmdW5jdGlvbiAoJCkge1xuXG4gICAgICAgICAvLyBTZWFyY2hcblxuICAgICAgICAgLy8gQ2hlY2sgd2hlbiBhIHVzZXIgaXMgdHlwaW5nIGluIHNlYXJjaFxuICAgICAgICAgJCgnI3NlYXJjaC1maWVsZCcpLmtleXByZXNzKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAvLyBhZGQgYSBjbGFzcyB0byB0aGUgc2libGluZyByZXNldCBidXR0b25cbiAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQodGhpcykuc2libGluZ3MoJy5zZWFyY2gtZmllbGRfcmVzZXQnKS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICB9KTtcblxuICAgICAgICAgLy8gQWZ0ZXIgdGhlIHJlc2V0IGlzIGNsaWNrZWQsIHJlbW92ZSB0aGUgY2xhc3Nlc1xuICAgICAgICAgJCgnLnNlYXJjaC1maWVsZF9yZXNldCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAkKHRoaXMpLmJsdXIoKTtcbiAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQodGhpcykuc2libGluZ3MoJyNzZWFyY2gtZmllbGQnKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQoJyNzZWFyY2gtZmllbGQnKS5mb2N1cygpO1xuICAgICAgICAgfSk7XG5cbiAgICAgICB9KShqUXVlcnkpO1xuICAgICB9XG4gICB9O1xuIH0pKGpRdWVyeSwgRHJ1cGFsKTtcbiIsIi8qKlxuICogQGZpbGVcbiAqIEJlaGF2aW9ycyBmb3IgbWFpbiBtZW51IGRyb3Bkb3ducy5cbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuIChmdW5jdGlvbiAoJCwgRHJ1cGFsKSB7XG4gICBEcnVwYWwuYmVoYXZpb3JzLnByaW1hcnlOYXYgPSB7XG4gICAgIGF0dGFjaDogZnVuY3Rpb24gKGNvbnRleHQsIHNldHRpbmdzKSB7XG4gICAgICAgKGZ1bmN0aW9uICgkKSB7XG5cbiAgICAgICAgIGZ1bmN0aW9uIGNsb3NlU2VhcmNoKCkge1xuICAgICAgICAgICBzZWFyY2ggPSAkKCcuc2VhcmNoX21vZGFsJyk7XG4gICAgICAgICAgIGlmIChzZWFyY2guaGFzQ2xhc3MoJ2lzLW9wZW4nKSkge1xuICAgICAgICAgICAgICQoJy5zZWFyY2hfbW9kYWwnKS5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xuICAgICAgICAgICB9XG4gICAgICAgICB9XG5cbiAgICAgICAgIGZ1bmN0aW9uIHNob3dNZW51KCkge1xuICAgICAgICAgICAvLyBhZGQgYSBib2R5IGNsYXNzIHNheWluZyB0aGF0IHRoZSBtZW51IGlzIG9wZW5cbiAgICAgICAgICAgJCgnYm9keScpLmFkZENsYXNzKCdib2R5LW5hdi1wcmltYXJ5LW9wZW4nKTtcbiAgICAgICAgICAgJCgnLm5hdi1wcmltYXJ5X2xpc3QnKS5hZGRDbGFzcygnbmF2LXByaW1hcnlfbGlzdC1tb2JpbGUtb3BlbicpO1xuICAgICAgICAgfVxuXG4gICAgICAgICBmdW5jdGlvbiBzaG93T3ZlcmxheSgpIHtcbiAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgJCgnLm5hdi1wcmltYXJ5X292ZXJsYXktbW9iaWxlJykuYWRkQ2xhc3MoJ25hdi1wcmltYXJ5X292ZXJsYXktbW9iaWxlLW9uJyk7XG4gICAgICAgICAgIH0sIDUwKTtcbiAgICAgICAgIH1cblxuICAgICAgICAgZnVuY3Rpb24gY2xvc2VNZW51KCkge1xuICAgICAgICAgICAkKCdib2R5JykucmVtb3ZlQ2xhc3MoJ2JvZHktbmF2LXByaW1hcnktb3BlbicpO1xuICAgICAgICAgICAkKCcubmF2LXByaW1hcnlfbGlzdCcpLnJlbW92ZUNsYXNzKCduYXYtcHJpbWFyeV9saXN0LW1vYmlsZS1vcGVuJykuYWRkQ2xhc3MoJ25hdi1wcmltYXJ5X2xpc3QtbW9iaWxlLWNsb3NlZCcpO1xuICAgICAgICAgfVxuXG4gICAgICAgICBmdW5jdGlvbiByZW1vdmVBY3RpdmUoKSB7XG4gICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICQoJy5uYXYtcHJpbWFyeV9zZWN0aW9uJykucmVtb3ZlQ2xhc3MoJ25hdi1wcmltYXJ5X3NlY3Rpb24tYWN0aXZlJykucmVtb3ZlQ2xhc3MoJ2lzLWhpZGRlbicpO1xuICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgfVxuXG4gICAgICAgICBmdW5jdGlvbiBjbG9zZU92ZXJsYXkoKSB7XG4gICAgICAgICAgICQoJy5uYXYtcHJpbWFyeV9vdmVybGF5LW1vYmlsZScpLnJlbW92ZUNsYXNzKCduYXYtcHJpbWFyeV9vdmVybGF5LW1vYmlsZS1vbicpO1xuICAgICAgICAgfVxuXG4gICAgICAgICBmdW5jdGlvbiBjaGFuZ2VBY3RpdmUoc2VjdGlvbikge1xuICAgICAgICAgICBpZiAoc2VjdGlvbi5oYXNDbGFzcygnbmF2LXByaW1hcnlfYnV0dG9uJykpIHtcbiAgICAgICAgICAgICAvLyB0b2dnbGUgYSBjbGlja2VkIHN0YXRlIG9uIHRoZSB0cmlnZ2VyXG4gICAgICAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcygnbmF2LXByaW1hcnlfYnV0dG9uLWNsaWNrZWQnKTtcbiAgICAgICAgICAgICAvLyBzaG93IHRoZSBvdmVybGF5XG4gICAgICAgICAgICAgc2hvd092ZXJsYXkoKTtcbiAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICBzZWN0aW9uLmFkZENsYXNzKCduYXYtcHJpbWFyeV9zZWN0aW9uLWFjdGl2ZScpO1xuICAgICAgICAgICAgIHNlY3Rpb24uc2libGluZ3MoJy5uYXYtcHJpbWFyeV9zZWN0aW9uJykucmVtb3ZlQ2xhc3MoJ25hdi1wcmltYXJ5X3NlY3Rpb24tYWN0aXZlJyk7XG4gICAgICAgICAgICAgaWYgKCAkKHdpbmRvdykud2lkdGgoKSA8IDc0MCApIHtcbiAgICAgICAgICAgICAgIHNlY3Rpb24uc2libGluZ3MoJy5uYXYtcHJpbWFyeV9zZWN0aW9uJykuYWRkQ2xhc3MoJ2lzLWhpZGRlbicpO1xuICAgICAgICAgICAgIH1cbiAgICAgICAgICAgfVxuICAgICAgICAgfVxuXG4gICAgICAgICAvLyBIYW5kbGluZyBmb3IgY2xpY2sgZXZlbnRzLiBXaGVuIHNvbWVvbmUgY2xpY2tzIHRoZSBuYXYsIHRoZSBtb2JpbGUgbmF2IGJ1dHRvbiwgb3IgYW55d2hlcmVcbiAgICAgICAgIC8vIG9uIHRoZSBwYWdlIGlmIHRoZSBtZW51IGlzIGFscmVhZHkgb3BlbjpcblxuICAgICAgICAgJChkb2N1bWVudCkub24oJ3RvdWNoc3RhcnQgY2xpY2snLCAnLmJvZHktbmF2LXByaW1hcnktb3BlbiwgLm5hdi1wcmltYXJ5X3NlY3Rpb24sIC5uYXYtcHJpbWFyeV9idXR0b24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAvLyBpcyB0aGlzIHRoZSBtb2JpbGUgYnV0dG9uP1xuICAgICAgICAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcygnbmF2LXByaW1hcnlfYnV0dG9uJykpIHtcbiAgICAgICAgICAgICAvLyBpcyB0aGUgbWVudSBhbHJlYWR5IG9wZW4/XG4gICAgICAgICAgICAgaWYgKCQoJ2JvZHknKS5oYXNDbGFzcygnYm9keS1uYXYtcHJpbWFyeS1vcGVuJykpIHtcbiAgICAgICAgICAgICAgIGNsb3NlTWVudSgpO1xuICAgICAgICAgICAgICAgY2xvc2VPdmVybGF5KCk7XG4gICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgIHNob3dNZW51KCk7XG4gICAgICAgICAgICAgICBzaG93T3ZlcmxheSgpO1xuICAgICAgICAgICAgICAgY2xvc2VTZWFyY2goKTtcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgLy8gaXMgdGhpcyB0aGUgbmF2P1xuICAgICAgICAgICBlbHNlIGlmICgkKHRoaXMpLmhhc0NsYXNzKCduYXYtcHJpbWFyeV9zZWN0aW9uJykpIHtcbiAgICAgICAgICAgICAvLyBpcyB0aGlzIHRoZSBhY3RpdmUgaXRlbT9cbiAgICAgICAgICAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcygnbmF2LXByaW1hcnlfc2VjdGlvbi1hY3RpdmUnKSkge1xuICAgICAgICAgICAgICAgaWYgKCAkKHdpbmRvdykud2lkdGgoKSA8IDc0MCApIHtcbiAgICAgICAgICAgICAgICAgcmVtb3ZlQWN0aXZlKCk7XG4gICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICBjbG9zZU1lbnUoKTtcbiAgICAgICAgICAgICAgICAgY2xvc2VPdmVybGF5KCk7XG4gICAgICAgICAgICAgICAgIHJlbW92ZUFjdGl2ZSgpO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICBpZiAoISQoJ2JvZHknKS5oYXNDbGFzcygnYm9keS1uYXYtcHJpbWFyeS1vcGVuJykpIHtcbiAgICAgICAgICAgICAgICAgc2hvd01lbnUoKTtcbiAgICAgICAgICAgICAgICAgc2hvd092ZXJsYXkoKTtcbiAgICAgICAgICAgICAgICAgY2xvc2VTZWFyY2goKTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIGNoYW5nZUFjdGl2ZSgkKHRoaXMpKTtcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgLy8gaXMgdGhpcyBzb21lIG90aGVyIHBhcnQgb2YgdGhlIGRvY3VtZW50IChjbGlja2luZyBvdXRzaWRlIHRoZSBuYXYpP1xuICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICBjbG9zZU1lbnUoKTtcbiAgICAgICAgICAgICBjbG9zZU92ZXJsYXkoKTtcbiAgICAgICAgICAgICByZW1vdmVBY3RpdmUoKTtcbiAgICAgICAgICAgfVxuICAgICAgICAgfSk7XG5cbiAgICAgICB9KShqUXVlcnkpO1xuICAgICB9XG4gICB9O1xuIH0pKGpRdWVyeSwgRHJ1cGFsKTtcbiIsIi8qKlxuICogQGZpbGVcbiAqIEp1bXAgbmF2IGJlaGF2aW9ycyBmb3IgYXJ0aWNsZSBwYWdlcy5cbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuIChmdW5jdGlvbiAoJCwgRHJ1cGFsKSB7XG4gICBEcnVwYWwuYmVoYXZpb3JzLmp1bXBOYXYgPSB7XG4gICAgIGF0dGFjaDogZnVuY3Rpb24gKGNvbnRleHQsIHNldHRpbmdzKSB7XG4gICAgICAgKGZ1bmN0aW9uICgkKSB7XG5cbiAgICAgICAgIC8vY2hlY2sgaWYgYSBqdW1wIG5hdiBleGlzdHMgYW5kIGlzIHZpc2libGUgb24gdGhlIHBhZ2VcbiAgICAgICAgIC8vb3RoZXJ3aXNlIHdlIHNob3VsZG4ndCBkbyBhbnkgb2YgdGhpc1xuICAgICAgICAgaWYgKCQoJy5qdW1wbmF2LWNvbnRlbnQnKS5sZW5ndGggPiAwICYmXG4gICAgICAgICAkKCcuYXJ0aWNsZS1ib2R5JykubGVuZ3RoID4gMCAmJlxuICAgICAgICAgJCgnLmp1bXAtbmF2X2xpc3QgbGknKS5jaGlsZHJlbigpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgaW5pdGlhbGl6ZUp1bXBOYXYoKTtcbiAgICAgICAgIH1cblxuICAgICAgICAgZnVuY3Rpb24gaW5pdGlhbGl6ZUp1bXBOYXYoKXtcbiAgICAgICAgICAgLy8gV2hlbiBhIHVzZXIgY2xpY2tzIG9uIHRoZSByaWJib24gdHJpZ2dlciAobWFpbilcbiAgICAgICAgICAgJCgnLmp1bXAtbmF2X3RpdGxlJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgLy8gVW5mb2N1cyBvbiB0aGUgZHJvcGRvd25cbiAgICAgICAgICAgICAkKHRoaXMpLmJsdXIoKTtcbiAgICAgICAgICAgICAvLyBhZGQgYSBjbGFzcyB0byB0aGUgcGFyZW50XG4gICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnRzKCcjanVtcC1uYXYnKS50b2dnbGVDbGFzcygnaXMtY2xvc2VkJyk7XG4gICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgIC8vIFdoZW4gYSB1c2VyIGNsaWNrcyBvbiBhIHRpdGxlIGxpbmssIGNsb3NlIGRyb3Bkb3duXG4gICAgICAgICAgICQoJy5qdW1wLW5hdl9saXN0LWl0ZW0gYScpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgIC8vIGFkZCBhIGNsYXNzIHRvIHRoZSBwYXJlbnRcbiAgICAgICAgICAgICAkKCcjanVtcC1uYXYnKS50b2dnbGVDbGFzcygnaXMtY2xvc2VkJyk7XG4gICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgLy8gT24gcGFnZSBzY3JvbGxcbiAgICAgICAgICAgJCh3aW5kb3cpLnNjcm9sbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICB2YXIgZG9jID0gJChkb2N1bWVudCk7XG4gICAgICAgICAgICAgdmFyIHdpbmRvd1RvcCA9ICQod2luZG93KS5zY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICB2YXIgZGl2VG9wID0gJCgnLmp1bXBuYXYtYW5jaG9yJykub2Zmc2V0KCkudG9wO1xuICAgICAgICAgICAgIHZhciBib2R5ID0gZG9jLmZpbmQoJy5hcnRpY2xlLWJvZHknKTtcbiAgICAgICAgICAgICB2YXIgY29udGVudCA9IGRvYy5maW5kKCcuanVtcG5hdi1jb250ZW50Jyk7XG4gICAgICAgICAgICAgdmFyIHN0aWNreUJvdHRvbSA9IGNvbnRlbnQub2Zmc2V0KCkudG9wICsgY29udGVudC5oZWlnaHQoKTtcbiAgICAgICAgICAgICB2YXIgYm9keUJvdHRvbSA9IGJvZHkub2Zmc2V0KCkudG9wICsgYm9keS5oZWlnaHQoKTtcblxuICAgICAgICAgICAgIC8vIFRyaWdnZXIgZml4ZWQgY2xhc3NcbiAgICAgICAgICAgICBpZiAod2luZG93VG9wID4gZGl2VG9wKSB7XG4gICAgICAgICAgICAgICAkKCcjanVtcC1uYXYnKS5hZGRDbGFzcygnZml4ZWQnKTtcbiAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgJCgnI2p1bXAtbmF2JykucmVtb3ZlQ2xhc3MoJ2ZpeGVkJyk7XG4gICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgLy8gU2hvdyAvIGhpZGUganVtcCBuYXZcbiAgICAgICAgICAgICBpZihzdGlja3lCb3R0b20gPiBib2R5Qm90dG9tKSB7XG4gICAgICAgICAgICAgICBjb250ZW50LmhpZGUoKTtcbiAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgY29udGVudC5mYWRlSW4oMjUwKTtcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgLy8gQW5pbWF0ZSBzY3JvbGwgb24ganVtcCBuYXYgY2xpY2tcbiAgICAgICAgICAgJCgnLmp1bXAtbmF2X2xpc3QgYScpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICB2YXIganVtcG9iaiA9ICQodGhpcyk7XG4gICAgICAgICAgICAgdmFyIHRhcmdldCA9IGp1bXBvYmouYXR0cignaHJlZicpO1xuICAgICAgICAgICAgIHZhciB0aGVzcGVlZCA9IDUwMDtcbiAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJCh0YXJnZXQpLm9mZnNldCgpLnRvcCAtIDEwMDtcbiAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgICAkKCdodG1sLGJvZHknKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgIHNjcm9sbFRvcDogb2Zmc2V0XG4gICAgICAgICAgICAgfSwgdGhlc3BlZWQpO1xuICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgIHZhciBhQ2hpbGRyZW4gPSAkKCcuanVtcC1uYXZfbGlzdCBsaScpLmNoaWxkcmVuKCk7IC8vIGZpbmQgdGhlIGEgY2hpbGRyZW4gb2YgdGhlIGxpc3QgaXRlbXNcbiAgICAgICAgICAgdmFyIGFBcnJheSA9IFtdOyAvLyBjcmVhdGUgdGhlIGVtcHR5IGFBcnJheVxuICAgICAgICAgICBmb3IgKHZhciBpPTA7IGkgPCBhQ2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICB2YXIgYUNoaWxkID0gYUNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgIHZhciBhaHJlZiA9ICQoYUNoaWxkKS5hdHRyKCdocmVmJyk7XG4gICAgICAgICAgICAgYUFycmF5LnB1c2goYWhyZWYpO1xuICAgICAgICAgICB9XG5cbiAgICAgICAgICAgLy8gVHJpZ2dlciBpcy1hY3RpdmUgY2xhc3Mgd2hlbiB1c2VyIHNjcm9sbHMgaW50byBlYWNoIHNlY3Rpb25cbiAgICAgICAgICAgJCh3aW5kb3cpLnNjcm9sbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICB2YXIgd2luZG93UG9zID0gJCh3aW5kb3cpLnNjcm9sbFRvcCgpICsgMTA1OyAvLyBnZXQgdGhlIG9mZnNldCBvZiB0aGUgd2luZG93IGZyb20gdGhlIHRvcCBvZiBwYWdlXG4gICAgICAgICAgICAgdmFyIHdpbmRvd0hlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKTsgLy8gZ2V0IHRoZSBoZWlnaHQgb2YgdGhlIHdpbmRvd1xuICAgICAgICAgICAgIHZhciBkb2NIZWlnaHQgPSAkKGRvY3VtZW50KS5oZWlnaHQoKTtcblxuICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaSA8IGFBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgdmFyIHRoZUlEID0gYUFycmF5W2ldO1xuICAgICAgICAgICAgICAgdmFyIGRpdlBvcyA9ICQodGhlSUQpLm9mZnNldCgpLnRvcDsgLy8gZ2V0IHRoZSBvZmZzZXQgb2YgdGhlIGRpdiBmcm9tIHRoZSB0b3Agb2YgcGFnZVxuICAgICAgICAgICAgICAgdmFyIGRpdkhlaWdodCA9ICQodGhlSUQpLmhlaWdodCgpOyAvLyBnZXQgdGhlIGhlaWdodCBvZiB0aGUgZGl2IGluIHF1ZXN0aW9uXG4gICAgICAgICAgICAgICBpZiAod2luZG93UG9zID49IGRpdlBvcyAmJiB3aW5kb3dQb3MgPCAoZGl2UG9zICsgZGl2SGVpZ2h0KSkge1xuICAgICAgICAgICAgICAgICAkKCdhW2hyZWY9XCInICsgdGhlSUQgKyAnXCJdJykucGFyZW50KFwibGlcIikuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgJCgnYVtocmVmPVwiJyArIHRoZUlEICsgJ1wiXScpLnBhcmVudChcImxpXCIpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICBpZih3aW5kb3dQb3MgKyB3aW5kb3dIZWlnaHQgPT0gZG9jSGVpZ2h0KSB7XG4gICAgICAgICAgICAgICBpZiAoISQoJy5qdW1wLW5hdl9saXN0IGxpOmxhc3QtY2hpbGQnKS5oYXNDbGFzcygnaXMtYWN0aXZlJykpIHtcbiAgICAgICAgICAgICAgICAgdmFyIG5hdkFjdGl2ZUN1cnJlbnQgPSAkKCcuaXMtYWN0aXZlJykuYXR0cignaHJlZicpO1xuICAgICAgICAgICAgICAgICAkKCdhW2hyZWY9XCInICsgbmF2QWN0aXZlQ3VycmVudCArICdcIl0nKS5wYXJlbnQoXCJsaVwiKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgICQoJy5qdW1wLW5hdl9saXN0IGxpOmxhc3QtY2hpbGQnKS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICB9KTtcbiAgICAgICAgIH1cblxuICAgICAgIH0pKGpRdWVyeSk7XG4gICAgIH1cbiAgIH07XG4gfSkoalF1ZXJ5LCBEcnVwYWwpO1xuIiwiLyoqXG4gKiBAZmlsZVxuICogQmVoYXZpb3IgZm9yIHRhYnMgb24gaG9tZXBhZ2UgYXVkaWVuY2Ugc2VsZWN0b3IuXG4gKlxuICogSmF2YVNjcmlwdCBzaG91bGQgYmUgbWFkZSBjb21wYXRpYmxlIHdpdGggbGlicmFyaWVzIG90aGVyIHRoYW4galF1ZXJ5IGJ5XG4gKiB3cmFwcGluZyBpdCB3aXRoIGFuIFwiYW5vbnltb3VzIGNsb3N1cmVcIi4gU2VlOlxuICogLSBodHRwczovL2RydXBhbC5vcmcvbm9kZS8xNDQ2NDIwXG4gKiAtIGh0dHA6Ly93d3cuYWRlcXVhdGVseWdvb2QuY29tLzIwMTAvMy9KYXZhU2NyaXB0LU1vZHVsZS1QYXR0ZXJuLUluLURlcHRoXG4gKi9cbiAoZnVuY3Rpb24gKCQsIERydXBhbCkge1xuICAgRHJ1cGFsLmJlaGF2aW9ycy50YWJzQXVkaWVuY2VTZWxlY3RvciA9IHtcbiAgICAgYXR0YWNoOiBmdW5jdGlvbiAoY29udGV4dCwgc2V0dGluZ3MpIHtcbiAgICAgICAoZnVuY3Rpb24gKCQpIHtcblxuICAgICAgICAgdmFyIGJwX21lZCA9IDkwMDsgLy8gOTAwcHggPSAkYnAtbWVkIGNzcyB2YXJpYWJsZVxuXG4gICAgICAgICAvLyBjaGVja1dpZHRoIGZ1bmN0aW9uXG4gICAgICAgICBmdW5jdGlvbiBjaGVja1dpZHRoKCkge1xuICAgICAgICAgICBpZiAoKCQod2luZG93KS53aWR0aCgpID49IGJwX21lZCkpIHtcbiAgICAgICAgICAgICAvLyBTaG93IGFsbCBsaSBzZWxlY3RvcnNcbiAgICAgICAgICAgICAkKCcudGFicy1hdWRpZW5jZV9zZWxlY3Rvcl9saXN0ID4gbGknKS5jc3MoJ2Rpc3BsYXknLCAnaW5saW5lLWJsb2NrJyk7XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgLy8gRGlzcGxheSBsaXN0LWl0ZW0gZm9yIGFsbCBsaSBzZWxlY3RvcnNcbiAgICAgICAgICAgICAkKCcudGFicy1hdWRpZW5jZV9zZWxlY3Rvcl9saXN0ID4gbGknKS5jc3MoJ2Rpc3BsYXknLCAnbGlzdC1pdGVtJyk7XG4gICAgICAgICAgICAgLy8gSGlkZSBhbGwgbGkgc2VsZWN0b3JzIGV4cGVjdCBmaXJzdCBvbmVcbiAgICAgICAgICAgICAkKCcudGFicy1hdWRpZW5jZV9zZWxlY3Rvcl9saXN0ID4gbGk6Z3QoMCknKS5oaWRlKCk7XG4gICAgICAgICAgIH1cbiAgICAgICAgIH1cblxuICAgICAgICAgLy8gUnVuIGNoZWNrV2lkdGhcbiAgICAgICAgIGNoZWNrV2lkdGgoKTtcbiAgICAgICAgIC8vIFJlLXJ1biBjaGVja1dpZHRoIG9uIHdpbmRvdyByZXNpemVcbiAgICAgICAgICQod2luZG93KS5yZXNpemUoY2hlY2tXaWR0aCk7XG5cbiAgICAgICAgIC8vIE1vYmlsZSBBdWRpZW5jZSBTZWxlY3RvciB0YWJzXG4gICAgICAgICAkKCcudGFicy1hdWRpZW5jZV9zZWxlY3Rvcl9saXN0JykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAvLyBJZiB2aWV3cG9ydCBpcyBzbWFsbGVyIHRoYW4gOTAwcHhcbiAgICAgICAgICAgaWYgKCgkKHdpbmRvdykud2lkdGgoKSA8IGJwX21lZCkpIHtcbiAgICAgICAgICAgICAvLyBBZGQgdGhlIGFjdGl2ZSBjbGFzcyB0byB0aGUgbGlzdCB3aGVuIGl0IGlzIGNsaWNrZWRcbiAgICAgICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKCdvcGVuJyk7XG4gICAgICAgICAgICAgLy8gVG9nZ2xlIGhpZGRlbiBpdGVtcyBvbiBjbGlja1xuICAgICAgICAgICAgICQodGhpcykuY2hpbGRyZW4oJ2xpOmd0KDApJykuc2xpZGVUb2dnbGUoKTtcbiAgICAgICAgICAgfVxuICAgICAgICAgfSk7XG5cbiAgICAgICB9KShqUXVlcnkpO1xuICAgICB9XG4gICB9O1xuIH0pKGpRdWVyeSwgRHJ1cGFsKTtcbiIsIi8qKlxuICogQGZpbGVcbiAqIE1ha2UgYWNjb3JkaW9ucyBhY2NvcmRpb24teS5cbiAqXG4gKiBKYXZhU2NyaXB0IHNob3VsZCBiZSBtYWRlIGNvbXBhdGlibGUgd2l0aCBsaWJyYXJpZXMgb3RoZXIgdGhhbiBqUXVlcnkgYnlcbiAqIHdyYXBwaW5nIGl0IHdpdGggYW4gXCJhbm9ueW1vdXMgY2xvc3VyZVwiLiBTZWU6XG4gKiAtIGh0dHBzOi8vZHJ1cGFsLm9yZy9ub2RlLzE0NDY0MjBcbiAqIC0gaHR0cDovL3d3dy5hZGVxdWF0ZWx5Z29vZC5jb20vMjAxMC8zL0phdmFTY3JpcHQtTW9kdWxlLVBhdHRlcm4tSW4tRGVwdGhcbiAqL1xuIChmdW5jdGlvbiAoJCwgRHJ1cGFsKSB7XG4gICBEcnVwYWwuYmVoYXZpb3JzLmFjY29yZGlvbiA9IHtcbiAgICAgYXR0YWNoOiBmdW5jdGlvbiAoY29udGV4dCwgc2V0dGluZ3MpIHtcbiAgICAgICAoZnVuY3Rpb24gKCQpIHtcblxuICAgICAgICAgLy8gU2VhcmNoXG5cbiAgICAgICAgIC8vIFdoZW4gYSB1c2VyIGNsaWNrcyBvbiB0aGUgcmliYm9uIHRyaWdnZXIgKG1haW4pXG4gICAgICAgICAkKCcuYWNjb3JkaW9uLXRyaWdnZXInKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgLy8gVW5mb2N1cyBvbiB0aGUgdHJpZ2dlclxuICAgICAgICAgICAkKHRoaXMpLmJsdXIoKTtcbiAgICAgICAgICAgLy8gYWRkIGEgY2xhc3MgdG8gdGhlIHNpYmxpbmcgYWNjb3JkaW9uIGNvbnRlbnRcbiAgICAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICQodGhpcykuc2libGluZ3MoJy5hY2NvcmRpb24tY29udGVudCcpLnRvZ2dsZUNsYXNzKCdpcy1hY3RpdmUnKS5zbGlkZVRvZ2dsZSgzMDApO1xuICAgICAgICAgfSk7XG5cbiAgICAgICB9KShqUXVlcnkpO1xuICAgICB9XG4gICB9O1xuIH0pKGpRdWVyeSwgRHJ1cGFsKTtcbiIsIi8qKlxuICogQGZpbGVcbiAqIEJlaGF2aW9ycyBmb3IgdGhlIGhvbWVwYWdlIGZlYXR1cmVkIGNvbnRlbnQgYmxvY2suXG4gKlxuICogSmF2YVNjcmlwdCBzaG91bGQgYmUgbWFkZSBjb21wYXRpYmxlIHdpdGggbGlicmFyaWVzIG90aGVyIHRoYW4galF1ZXJ5IGJ5XG4gKiB3cmFwcGluZyBpdCB3aXRoIGFuIFwiYW5vbnltb3VzIGNsb3N1cmVcIi4gU2VlOlxuICogLSBodHRwczovL2RydXBhbC5vcmcvbm9kZS8xNDQ2NDIwXG4gKiAtIGh0dHA6Ly93d3cuYWRlcXVhdGVseWdvb2QuY29tLzIwMTAvMy9KYXZhU2NyaXB0LU1vZHVsZS1QYXR0ZXJuLUluLURlcHRoXG4gKi9cbiAoZnVuY3Rpb24gKCQsIERydXBhbCkge1xuICAgRHJ1cGFsLmJlaGF2aW9ycy5mZWF0dXJlZENvbnRlbnQgPSB7XG4gICAgIGF0dGFjaDogZnVuY3Rpb24gKGNvbnRleHQsIHNldHRpbmdzKSB7XG4gICAgICAgKGZ1bmN0aW9uICgkKSB7XG5cbiAgICAgICAgIC8vIEhpZGUgaXRlbXMgZXhjZXB0IGZpcnN0IDNcbiAgICAgICAgICQoJy5hdWRpZW5jZV9mZWF0dXJlZC1oZXJvX2l0ZW0nKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAkKHRoaXMpLmZpbmQoJy5saXN0X2ZlYXR1cmVkX2NvbnRlbnQtaXRlbTpndCgyKScpLmFkZENsYXNzKCdoaWRkZW4nKS5oaWRlKCk7XG4gICAgICAgICB9KTtcblxuICAgICAgICAgLy8gQ3JlYXRlIGEgdG9nZ2xlIGJldHdlZW4gTG9hZCBtb3JlIGFuZCBsZXNzXG4gICAgICAgICAkKCcubGlua19sb2FkX21vcmVfbGVzcyBhJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgLy8gRmVhdHVyZWQgY29udGVudCBwYXRoIHZhcmlhYmxlXG4gICAgICAgICAgIHZhciBmZWF0dXJlZENvbnRlbnQgPSAnLmF1ZGllbmNlX2ZlYXR1cmVkLWhlcm9faXRlbS5hY3RpdmUgLmxpc3RfZmVhdHVyZWRfY29udGVudC1pdGVtJztcbiAgICAgICAgICAgdmFyIGZlYXR1cmVkQ29udGVudFNob3duID0gJChmZWF0dXJlZENvbnRlbnQrJy5zaG93bicpO1xuICAgICAgICAgICB2YXIgZmVhdHVyZWRDb250ZW50SGlkZGVuID0gJChmZWF0dXJlZENvbnRlbnQrJy5oaWRkZW4nKTtcblxuICAgICAgICAgICAvLyBJZiBmZWF0dXJlZCBjb250ZW50IGhhcyBzaG93IGNsYXNzIGRvIHRoaXNcbiAgICAgICAgICAgaWYoJChmZWF0dXJlZENvbnRlbnQpLmhhc0NsYXNzKCdoaWRkZW4nKSkge1xuXG4gICAgICAgICAgICAgLy8gVXBkYXRlZCBsaW5rIHRleHQgYW5kIGljb25cbiAgICAgICAgICAgICAkKHRoaXMpLmNvbnRlbnRzKCkuZmlyc3QoKVswXS50ZXh0Q29udGVudD0nTG9hZCBsZXNzICc7XG4gICAgICAgICAgICAgJCh0aGlzKS5jaGlsZHJlbignLmljb24nKS5yZW1vdmVDbGFzcygnaWNvbi12aWV3bW9yZScpLmFkZENsYXNzKCdpY29uLXZpZXdsZXNzJyk7XG5cbiAgICAgICAgICAgICAvLyBTbGlkZSBvcGVuIGhpZGRlbiBjb250ZW50IG9uIGNsaWNrXG4gICAgICAgICAgICAgZmVhdHVyZWRDb250ZW50SGlkZGVuLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCdoaWRkZW4nKS5hZGRDbGFzcygnc2hvd24nKTtcbiAgICAgICAgICAgICAgICQodGhpcykuc2xpZGVEb3duKDMwMCk7XG4gICAgICAgICAgICAgfSk7XG4gICAgICAgICAgIH1cblxuICAgICAgICAgICAvLyBJZiBmZWF0dXJlZCBjb250ZW50IGhhcyBoaWRlIGNsYXNzIGRvIHRoaXNcbiAgICAgICAgICAgZWxzZSBpZigkKGZlYXR1cmVkQ29udGVudCkuaGFzQ2xhc3MoJ3Nob3duJykpIHtcblxuICAgICAgICAgICAgIC8vIFVwZGF0ZWQgbGluayB0ZXh0IGFuZCBpY29uXG4gICAgICAgICAgICAgJCh0aGlzKS5jb250ZW50cygpLmZpcnN0KClbMF0udGV4dENvbnRlbnQ9J0xvYWQgbW9yZSAnO1xuICAgICAgICAgICAgICQodGhpcykuY2hpbGRyZW4oJy5pY29uJykucmVtb3ZlQ2xhc3MoJ2ljb24tdmlld2xlc3MnKS5hZGRDbGFzcygnaWNvbi12aWV3bW9yZScpO1xuXG4gICAgICAgICAgICAgLy8gU2xpZGUgY2xvc2UgaGlkZGVuIGNvbnRlbnQgb24gY2xpY2tcbiAgICAgICAgICAgICBmZWF0dXJlZENvbnRlbnRTaG93bi5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnc2hvd24nKS5hZGRDbGFzcygnaGlkZGVuJyk7XG4gICAgICAgICAgICAgICAkKHRoaXMpLnNsaWRlVXAoMzAwKTtcbiAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgfTtcblxuICAgICAgICAgfSk7XG5cbiAgICAgICAgIC8vIEF1ZGllbmNlIHRhYiBpbnRlcmFjdGlvblxuICAgICAgICAgJCgnLnRhYnMtYXVkaWVuY2Vfc2VsZWN0b3JfbGlzdF9pdGVtIGEnKS5jbGljayhmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAvLyBUYWIgZGF0YSB2YXJpYWJsZVxuICAgICAgICAgICB2YXIgdGFiX2lkID0gJCh0aGlzKS5hdHRyKCdkYXRhLXRhYicpO1xuXG4gICAgICAgICAgIC8vIFJlbW92ZSBjbGFzc2VzXG4gICAgICAgICAgICQoJy50YWJzLWF1ZGllbmNlX3NlbGVjdG9yX2xpc3RfaXRlbSBhJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAkKCcuYXVkaWVuY2VfZmVhdHVyZWQtaGVyb19pdGVtJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuXG4gICAgICAgICAgIC8vIEFkZCBjbGFzc2VzXG4gICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAkKCcjJyt0YWJfaWQpLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgIH0pO1xuXG4gICAgICAgfSkoalF1ZXJ5KTtcbiAgICAgfVxuICAgfTtcbiB9KShqUXVlcnksIERydXBhbCk7XG4iLCIvKipcbiAqIEBmaWxlXG4gKiBUb2dnbGUgc2VsZWN0IGJsb2NrIG1lc3NhZ2UuXG4gKlxuICogSmF2YVNjcmlwdCBzaG91bGQgYmUgbWFkZSBjb21wYXRpYmxlIHdpdGggbGlicmFyaWVzIG90aGVyIHRoYW4galF1ZXJ5IGJ5XG4gKiB3cmFwcGluZyBpdCB3aXRoIGFuIFwiYW5vbnltb3VzIGNsb3N1cmVcIi4gU2VlOlxuICogLSBodHRwczovL2RydXBhbC5vcmcvbm9kZS8xNDQ2NDIwXG4gKiAtIGh0dHA6Ly93d3cuYWRlcXVhdGVseWdvb2QuY29tLzIwMTAvMy9KYXZhU2NyaXB0LU1vZHVsZS1QYXR0ZXJuLUluLURlcHRoXG4gKi9cbiAoZnVuY3Rpb24gKCQsIERydXBhbCkge1xuICAgRHJ1cGFsLmJlaGF2aW9ycy5ibG9ja1NlbGVjdCA9IHtcbiAgICAgYXR0YWNoOiBmdW5jdGlvbiAoY29udGV4dCwgc2V0dGluZ3MpIHtcbiAgICAgICAoZnVuY3Rpb24gKCQpIHtcblxuICAgICAgICAgJCgnLmJsb2NrLXNlbGVjdCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKCdibG9jay1zZWxlY3Qtc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgJCgnLmJsb2NrLXNlbGVjdF9tZXNzYWdlJykudG9nZ2xlQ2xhc3MoJ2Jsb2NrLXNlbGVjdF9tZXNzYWdlLWhpZGRlbicpOyAgfSk7XG5cbiAgICAgICAgIH0pKGpRdWVyeSk7XG4gICAgICAgfVxuICAgICB9O1xuICAgfSkoalF1ZXJ5LCBEcnVwYWwpO1xuIiwiLyoqXG4gKiBAZmlsZVxuICogTWFrZSBwcmltYXJ5IGhlYWRlciBzdGlja3kuXG4gKlxuICogSmF2YVNjcmlwdCBzaG91bGQgYmUgbWFkZSBjb21wYXRpYmxlIHdpdGggbGlicmFyaWVzIG90aGVyIHRoYW4galF1ZXJ5IGJ5XG4gKiB3cmFwcGluZyBpdCB3aXRoIGFuIFwiYW5vbnltb3VzIGNsb3N1cmVcIi4gU2VlOlxuICogLSBodHRwczovL2RydXBhbC5vcmcvbm9kZS8xNDQ2NDIwXG4gKiAtIGh0dHA6Ly93d3cuYWRlcXVhdGVseWdvb2QuY29tLzIwMTAvMy9KYXZhU2NyaXB0LU1vZHVsZS1QYXR0ZXJuLUluLURlcHRoXG4gKi9cbiAoZnVuY3Rpb24gKCQsIERydXBhbCkge1xuICAgRHJ1cGFsLmJlaGF2aW9ycy5oZWFkZXJQcmltYXJ5ID0ge1xuICAgICBhdHRhY2g6IGZ1bmN0aW9uIChjb250ZXh0LCBzZXR0aW5ncykge1xuICAgICAgIChmdW5jdGlvbiAoJCkge1xuXG4gICAgICAgICAvL2NoZWNrIGlmIGEgcHJpbWFyeSBuYXYgZXhpc3RzIGFuZCBpcyB2aXNpYmxlIG9uIHRoZSBwYWdlXG4gICAgICAgICAvL290aGVyd2lzZSB3ZSBzaG91bGRuJ3QgZG8gYW55IG9mIHRoaXNcbiAgICAgICAgIGlmICgkKCcuaGVhZGVyLXByaW1hcnktc3BhbicpLmxlbmd0aCA+IDApe1xuICAgICAgICAgICBpbml0aWFsaXplUHJpbWFyeUhlYWRlcigpO1xuICAgICAgICAgfVxuXG4gICAgICAgICAvLyBGaW5kIGhlaWdodCBvZiByaWJib24gYW5kIGhlYWRlci1wcmltYXJ5IHRvIGNyZWF0ZSBwcm9wZXIgc3BhY2luZ1xuICAgICAgICAgZnVuY3Rpb24gY2hlY2tIZWlnaHQoKSB7XG4gICAgICAgICAgIHZhciBoZWFkZXJIZWlnaHQgPSAkKCcuaGVhZGVyLXByaW1hcnknKS5oZWlnaHQoKTtcbiAgICAgICAgICAgdmFyIHJpYmJvbkhlaWdodCA9ICQoJy5yaWJib24nKS5oZWlnaHQoKTtcblxuICAgICAgICAgICAkKCcuaGVhZGVyLXByaW1hcnktc3BhbicpLmNzcyh7J2hlaWdodCc6KGhlYWRlckhlaWdodCkrJ3B4J30pO1xuICAgICAgICAgICAkKCcuaGVhZGVyLXByaW1hcnknKS5jc3Moeyd0b3AnOihyaWJib25IZWlnaHQpKydweCd9KTtcbiAgICAgICAgIH1cblxuICAgICAgICAgZnVuY3Rpb24gaW5pdGlhbGl6ZVByaW1hcnlIZWFkZXIoKXtcbiAgICAgICAgICAgLy8gU2V0IGhlaWdodCBvbiBwYWdlIGxvYWRcbiAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBjaGVja0hlaWdodCgpOyB9LCAxMDApO1xuICAgICAgICAgICAvLyBDaGVjayBoZWlnaHQgb24gd2luZG93IHJlc2l6ZVxuICAgICAgICAgICAkKHdpbmRvdykucmVzaXplKGNoZWNrSGVpZ2h0KTtcblxuICAgICAgICAgICAvLyBBZGQgY2xhc3MgdG8gaGVhZGVyLXByaW1hcnkgb24gc2Nyb2xsXG4gICAgICAgICAgICQod2luZG93KS5zY3JvbGwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgdmFyIHNjcm9sbCA9ICQod2luZG93KS5zY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICB2YXIgb3MgPSAkKCcuaGVhZGVyLXByaW1hcnktc3BhbicpLm9mZnNldCgpLnRvcDtcbiAgICAgICAgICAgICB2YXIgaHQgPSAkKCcuaGVhZGVyLXByaW1hcnktc3BhbicpLmhlaWdodCgpO1xuXG4gICAgICAgICAgICAgaWYoc2Nyb2xsID4gb3MgKyBodCl7XG4gICAgICAgICAgICAgICAkKFwiLmhlYWRlci1wcmltYXJ5XCIpLmFkZENsYXNzKFwiaGVhZGVyLXByaW1hcnktLXN0aWNreVwiKTtcbiAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgJChcIi5oZWFkZXItcHJpbWFyeVwiKS5yZW1vdmVDbGFzcyhcImhlYWRlci1wcmltYXJ5LS1zdGlja3lcIik7XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICB9KTtcbiAgICAgICAgIH1cblxuICAgICAgIH0pKGpRdWVyeSk7XG4gICAgIH1cbiAgIH07XG4gfSkoalF1ZXJ5LCBEcnVwYWwpO1xuIiwiLyoqXG4gKiBAZmlsZVxuICogUmVzcG9uc2l2ZSBiZWhhdmlvcnMgZm9yIEVDIFRhYnMgQ291cnNlIEJyb3dzZXIuXG4gKlxuICogSmF2YVNjcmlwdCBzaG91bGQgYmUgbWFkZSBjb21wYXRpYmxlIHdpdGggbGlicmFyaWVzIG90aGVyIHRoYW4galF1ZXJ5IGJ5XG4gKiB3cmFwcGluZyBpdCB3aXRoIGFuIFwiYW5vbnltb3VzIGNsb3N1cmVcIi4gU2VlOlxuICogLSBodHRwczovL2RydXBhbC5vcmcvbm9kZS8xNDQ2NDIwXG4gKiAtIGh0dHA6Ly93d3cuYWRlcXVhdGVseWdvb2QuY29tLzIwMTAvMy9KYXZhU2NyaXB0LU1vZHVsZS1QYXR0ZXJuLUluLURlcHRoXG4gKi9cbiAoZnVuY3Rpb24gKCQsIERydXBhbCkge1xuICAgRHJ1cGFsLmJlaGF2aW9ycy5lY1RhYnNDb3Vyc2VCcm93c2VyID0ge1xuICAgICBhdHRhY2g6IGZ1bmN0aW9uIChjb250ZXh0LCBzZXR0aW5ncykge1xuICAgICAgIChmdW5jdGlvbiAoJCkge1xuXG4gICAgICAgICB2YXIgYnBfbWVkID0gOTAwOyAvLyA5MDBweCA9ICRicC1tZWQgY3NzIHZhcmlhYmxlXG5cbiAgICAgICAgIC8vIGNoZWNrV2lkdGggZnVuY3Rpb25cbiAgICAgICAgIGZ1bmN0aW9uIGNoZWNrV2lkdGgoKSB7XG4gICAgICAgICAgIGlmICgoJCh3aW5kb3cpLndpZHRoKCkgPj0gYnBfbWVkKSkge1xuICAgICAgICAgICAgIC8vIFNob3cgYWxsIGxpIHNlbGVjdG9yc1xuICAgICAgICAgICAgICQoJy50YWJzLWNvdXJzZV9icm93c2VyX2xpc3QtdGFicyA+IGxpJykuY3NzKCdkaXNwbGF5JywgJ2lubGluZS1ibG9jaycpO1xuICAgICAgICAgICB9XG4gICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgIC8vIERpc3BsYXkgbGlzdC1pdGVtIGZvciBhbGwgbGkgc2VsZWN0b3JzXG4gICAgICAgICAgICAgJCgnLnRhYnMtY291cnNlX2Jyb3dzZXJfbGlzdC10YWJzID4gbGknKS5jc3MoJ2Rpc3BsYXknLCAnbGlzdC1pdGVtJyk7XG4gICAgICAgICAgICAgLy8gSGlkZSBhbGwgbGkgc2VsZWN0b3JzIGV4cGVjdCBmaXJzdCBvbmVcbiAgICAgICAgICAgICAkKCcudGFicy1jb3Vyc2VfYnJvd3Nlcl9saXN0LXRhYnMgPiBsaTpndCgwKScpLmhpZGUoKTtcbiAgICAgICAgICAgfVxuICAgICAgICAgfVxuXG4gICAgICAgICAvLyBSdW4gY2hlY2tXaWR0aFxuICAgICAgICAgY2hlY2tXaWR0aCgpO1xuICAgICAgICAgLy8gUmUtcnVuIGNoZWNrV2lkdGggb24gd2luZG93IHJlc2l6ZVxuICAgICAgICAgJCh3aW5kb3cpLnJlc2l6ZShjaGVja1dpZHRoKTtcblxuICAgICAgICAgLy8gTW9iaWxlIENvdXJzZSBCcm93c2VyIHRhYnNcbiAgICAgICAgICQoJy50YWJzLWNvdXJzZV9icm93c2VyX2xpc3QtdGFicycpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgLy8gSWYgdmlld3BvcnQgaXMgc21hbGxlciB0aGFuIDkwMHB4XG4gICAgICAgICAgIGlmICgoJCh3aW5kb3cpLndpZHRoKCkgPCBicF9tZWQpKSB7XG4gICAgICAgICAgICAgLy8gQWRkIHRoZSBhY3RpdmUgY2xhc3MgdG8gdGhlIGxpc3Qgd2hlbiBpdCBpcyBjbGlja2VkXG4gICAgICAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcygnb3BlbicpO1xuICAgICAgICAgICAgIC8vIFRvZ2dsZSBoaWRkZW4gaXRlbXMgb24gY2xpY2tcbiAgICAgICAgICAgICAkKHRoaXMpLmNoaWxkcmVuKCdsaTpndCgwKScpLnNsaWRlVG9nZ2xlKCk7XG4gICAgICAgICAgIH1cbiAgICAgICAgIH0pO1xuXG4gICAgICAgfSkoalF1ZXJ5KTtcbiAgICAgfVxuICAgfTtcbiB9KShqUXVlcnksIERydXBhbCk7XG4iXX0=
