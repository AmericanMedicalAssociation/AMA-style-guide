/**
 * @file input-labels.js
 *
 * Copyright 2017 Palantir.net, Inc.
 * Reference http://codepen.io/anon/pen/GHKJj
 */

$(document).ready(function() {
  
  var onClass = "on";
  var showClass = "show";

  $("input, textarea, select")
    .bind("checkval", function ()
    {
      var label = $(this).prev("label");

      if (this.value !== "")
        label.addClass(showClass);

      else
        label.removeClass(showClass);
    })
    .on("keyup", function ()
    {
      $(this).trigger("checkval");
    })
    .on("focus", function ()
    {
      $(this).prev("label").addClass(onClass);
    })
    .on("blur", function ()
    {
        $(this).prev("label").removeClass(onClass);
    })
    .trigger("checkval");

  $("select")
    .on("change", function ()
    {
      var $this = $(this);

      if ($this.val() == "")
        $this.addClass("watermark");

      else
        $this.removeClass("watermark");

      $this.trigger("checkval");
    })
    .change();
});
