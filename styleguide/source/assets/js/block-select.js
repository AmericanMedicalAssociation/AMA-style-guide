jQuery.noConflict();
(function($) {
  $('.block-select__message').hide();

  $('.block-select').click(function() {
    $(this).toggleClass('block-select--selected');
    $('.block-select__message').toggle();
  });
})(jQuery);
