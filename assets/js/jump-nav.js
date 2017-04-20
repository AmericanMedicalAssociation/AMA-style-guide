jQuery.noConflict();
(function($) {

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

})(jQuery);
