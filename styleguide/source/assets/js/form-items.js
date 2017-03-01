/**
 * @file form-items.js
 *
 * Copyright 2017 Palantir.net, Inc.
 * Reference http://codepen.io/anon/pen/GHKJj
 */

$(document).ready(function() {

  //////////////////////////////////
  // Validate form
  //////////////////////////////////
  $("form.simple-step-form").validate({
    rules: {
      tel: {
        number: true
      }
    }
  });


  //////////////////////////////////
  // Initate form icons
  //////////////////////////////////

  // Create variable for all selectors needed for icon validator
  var iconSelector = $('.form-item input[type="text"], .form-item input[type="email"], .form-item input[type="url"], .form-item input[type="date"], .form-item input[type="month"], .form-item input[type="time"], .form-item input[type="datetime"], .form-item input[type="datetime-local"], .form-item input[type="week"], .form-item input[type="number"], .form-item input[type="search"], .form-item input[type="tel"], .form-item input[type="color"], .form-item select, .form-item textarea, .form-item-radio label.error, .form-item-checkbox label.error');

  // Create form item icon
  $(iconSelector).after('<span class="form-item_icon"></span>');


  //////////////////////////////////
  // Initate label show/hide
  //////////////////////////////////
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
