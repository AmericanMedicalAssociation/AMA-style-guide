jQuery.noConflict();
(function($) {
  $(document).ready(function(){
    $('iframe[src*="youtube"]').parent().fitVids();
  });
})(jQuery);
