jQuery.noConflict();
(function($) {

  function closeSearch() {
    search = $('.search_modal');
    if (search.hasClass('is-open')) {
      $('.search_modal').removeClass('is-open');
    }
  }

  function showMenu() {
    // add a body class saying that the menu is open
    $('body').addClass('body-nav-primary-open');
    $('.nav-primary_list').addClass('nav-primary_list-mobile-open').removeClass('nav-primary_list-mobile-closed');
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
    $('.nav-primary_section').removeClass('is-hidden').removeClass('nav-primary_section-active');
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
      section.find('.nav-primary_section_subnav').removeClass('is-hidden');
      section.siblings('.nav-primary_section').removeClass('nav-primary_section-active');
      if ( $(window).width() < 740 ) {
        section.siblings('.nav-primary_section').addClass('is-hidden');
        section.siblings('.nav-primary_section').each(function() {
          $(this).find('.nav-primary_section_subnav').addClass('is-hidden');
        });
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
    // is this the 'back' button?
    else if ($(this).hasClass('nav-primary_section_subnav_back')) {
      removeActive();
    }
    // is this some other part of the document (clicking outside the nav)?
    else {
      closeMenu();
      closeOverlay();
      removeActive();
    }
  });

})(jQuery);