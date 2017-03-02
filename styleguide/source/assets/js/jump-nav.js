$(document).ready(function() {
  // Search

  // When a user clicks on the ribbon trigger (main)
  $('.jump-nav_title').click(function() {
    // Unfocus on the dropdown
    $(this).blur();
    // add a class to the parent
    $(this).parents('#jump-nav').toggleClass('is-closed');
  });

  // sticky jumpnav
  var StickyElement = function(node){
    var doc = $(document),
        fixed = false,
        anchor = node.find('.jumpnav-anchor'),
        body = doc.find('.article-body'),
        content = node.find('.jumpnav-content');

    var onScroll = function(e){
      var docTop = doc.scrollTop(),
          anchorTop = anchor.offset().top,
          stickyBottom = content.offset().top + content.height(),
          bodyBottom = body.offset().top + body.height();

      if(docTop > anchorTop){
        if(!fixed){
          anchor.height(content.outerHeight());
          content.addClass('fixed');
          fixed = true;
        }
      }  else   {
        if(fixed){
          anchor.height(0);
          content.removeClass('fixed');
          fixed = false;
        }
      }

      if(stickyBottom > bodyBottom){
        content.hide();
      } else {
        content.fadeIn(250);
      }
    };

    $(window).on('scroll', onScroll);
  };

var demo = new StickyElement($('#sticky-jumpnav'));

});

