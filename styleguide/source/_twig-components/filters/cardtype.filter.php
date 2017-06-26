<?php

$filter = new Twig_SimpleFilter('cardtype', function ($string) {
  if($string == 'Landscape') {
    return 'cards' . $string;
  } else {
    return "I do not recognize that type!";
  }
});

?>