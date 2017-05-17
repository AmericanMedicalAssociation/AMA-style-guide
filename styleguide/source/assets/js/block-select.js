jQuery.noConflict();
(function($) {
  $('.block-select--message').hide();

  $('.block-select').click(function() {
    $(this).toggleClass('block-select--selected');
    $('.block-select--message').toggle();
  });
})(jQuery);
