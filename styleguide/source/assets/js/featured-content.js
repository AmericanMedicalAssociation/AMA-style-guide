jQuery.noConflict();
(function($) {

  // Hide items except first 3
  $('.audience_featured-hero_item').each(function() {
    $(this).find('.list_featured_content-item:gt(2)').addClass('show').hide();
  });

  // Create a toggle between Load more and less
  $('.link_load_more_less a').on('click', function() {

    // Featured content path variable
    var featuredContent = '.audience_featured-hero_item.active .list_featured_content-item';
    var featuredContentHide = $(featuredContent+'.hide');
    var featuredContentShow = $(featuredContent+'.show');

    // If featured content has show class do this
    if($(featuredContent).hasClass('show')) {

      // Updated link text and icon
      $(this).contents().first()[0].textContent='Load less ';
      $(this).children('.icon').removeClass('icon-viewmore').addClass('icon-viewless');

      // Slide open hidden content on click
      featuredContentShow.each(function() {
        $(this).removeClass('show').addClass('hide');
        $(this).slideDown(300);
      });
    }

    // If featured content has hide class do this
    else if($(featuredContent).hasClass('hide')) {

      // Updated link text and icon
      $(this).contents().first()[0].textContent='Load more ';
      $(this).children('.icon').removeClass('icon-viewless').addClass('icon-viewmore');

      // Slide close hidden content on click
      featuredContentHide.each(function() {
        $(this).removeClass('hide').addClass('show');
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
