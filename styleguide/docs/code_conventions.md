# Code Conventions

## Templating

Markup for each pattern in our style guide is created with [Twig](http://twig.sensiolabs.org/), a PHP-based HTML templating engine. You can view both the Twig syntax and the rendered HTML markup for a pattern by clicking on th egear icon in the upper right of every page and selecting "Show Pattern Info."

## HTML

### Semantic Markup

The introduction of HTML5 brought us developers a slew of new semantic tags. Rather than have to put everything in non-descript `<div>` containers, use semantic tags whenever possible. Tags like `<section>`, `<article>`, `<aside>`, `<header>`, `<footer>`, `<nav>`, etc. make the purpose and meaning of the content they contain clear not just to your fellow developers, but for screen-readers and search engines as well.

For a list of all valid HTML5 tags, please consult the [MDN element reference chart](https://developer.mozilla.org/en-US/docs/Web/HTML/Element).

### Aria Tags & Accessibility

Get reading! 

[https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA]()

## SASS/SCSS
We use [Sassy CSS](http://sass-lang.com/documentation/file.SCSS_FOR_SASS_USERS.html) for styling. In addition, class names and heirarchy follow the [BEM (Block Element Modifier)](http://getbem.com/) methodology to enable creation of reusable components and code sharing in the front-end. We use the abridged syntax recommended in the [18F Front End Guide](https://frontend.18f.gov/#bem) under their suggested custom methodology section.

The AMA Style Guide creates responsive components, and we use [Breakpoint](http://breakpoint-sass.com/) to manage our media queries. Breakpoint is fairly simple to use and has a very thorough [wiki](https://github.com/at-import/breakpoint/wiki) explaining its useage and capabilities.

All of our layouts utilize the [Sass-grid](https://github.com/digitaledgeit/sass-grid) grid system. Sass-grid is a very lightweight, flebox-based grid system.

Extend placeholders rather than classes. Placeholder selectors will not show up in the generated CSS, only the selectors that extend them will be included in the output. This means that if a placeholder exists only to be extended by other classes, our compiled CSS won't get bloated by unused classes.  Example:

    %button {
      background: $orange;
      text: #fff;
      width: 100%;
    }
    .button--tight {
      @extend %button
      display: inline;
      width: auto;
    }

## Javascript

Refer to Drupal's [Javascript Coding Standards](https://www.drupal.org/node/172169) for guidelines on our preferred javascript syntactic styles (like 2 spaces, use semicolons, etc). Familiarize yourself with these standards and adhere to them.

Any relevant javascript for a pattern should be stored in the pattern's own folder with the template and scss. We use jQuery in our applications, so you should make sure your pattern's js begins with an immediately invoked function expression (for closure) that accepts the jQuery library as a parameter like so: 

	(function($) { 
		//your pattern javascript here 
	}(jQuery);

If your javascript expects certain elements to be present in the DOM, make sure you wrap the js in an init function of some sort and check that the elements exist before initializing your script! Pattern Lab doesn't automagically encapsulate your javascript, so wrapping your js thusly prevents an abundance of errors if your selectors happen to be missing from a particular page of the style guide.

## Annotation and Documentation

Each pattern should have it's own accompanying Markdown file that contain a useful description of the pattern and links to the relevant Jira ticket/Github issues. This is required to provide context in the event of uncertainty about why a pattern was created or how it ought to be used.

Pattern Lab also provides the ability to [add annotations](http://patternlab.io/docs/pattern-adding-annotations.html) to your patterns. Use these annotations when you need to explanation about how a pattern is implemented.