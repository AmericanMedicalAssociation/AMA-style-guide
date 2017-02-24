$(document).ready(function() {

  // Hide all items except first 3
  $('.list_featured_content-item:gt(2)').hide();

  // Create a toggle between Load more and less
  $('.link_load_more_less a').on('click', function(){
    var clicks = $(this).data('clicks');

    // Odd click
    if (clicks) {
      $(this).contents().first()[0].textContent='Load more ';
      $(this).children('.icon').removeClass('icon-viewless').addClass('icon-viewmore');
      $('.list_featured_content-item:gt(2)').slideUp(300);
    }

    // Even click
    else {
      $(this).contents().first()[0].textContent='Load less ';
      $(this).children('.icon').removeClass('icon-viewmore').addClass('icon-viewless');
      $('.list_featured_content-item').not(':visible').each( function() {
        $(this).slideDown(300);
      });
    }
    $(this).data('clicks', !clicks);
  });

});
