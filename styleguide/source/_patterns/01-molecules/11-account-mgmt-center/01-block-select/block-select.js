jQuery.noConflict();
(function($) {

  $('.block-select').click(function() {
    $(this).toggleClass('block-select-selected');
    $('.block-select_message').toggleClass('block-select_message-hidden');  });
})(jQuery);
