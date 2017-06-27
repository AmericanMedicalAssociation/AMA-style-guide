# Code Conventions

## Templating

Markup for each pattern in our style guide is created with [Twig](http://twig.sensiolabs.org/), a PHP-based HTML templating engine. Twig allows us to easily include patterns inside of other patterns.

You can view both the Twig syntax and the rendered HTML markup for a pattern by clicking on the gear icon in the upper right of every page and selecting "Show Pattern Info."

### Placeholder Images
Images should only be committed to the style guide when they are providing "real representative content" in [Pattern Lab "Page" components](http://atomicdesign.bradfrost.com/chapter-2/#pages). Otherwise, dynamic placeholder images should be used. Placeholders should be generated in the form `https://ipsumimage.appspot.com/600x400?l=3:2|600x400&s=36` using the reduced ratio of the image for the benefit of the content team and the rendered dimensions of the image for the benefit of development teams implementing the pattern in a CMS.

Breaking this url down:
- `http://ipsumimage.appspot.com/`: the image generator. More [documentation available there](http://ipsumimage.appspot.com/).
- `600x400` the width x height with which the placeholder image will be generated
- `?l=3:2|600x400` the label text, with a pipe (|) separating lines. Our images should use [ratio]|[dimensions].
- `&s=36` the text size. This should only be tweaked if necessary.\

![This is a placeholder image](https://ipsumimage.appspot.com/600x400?l=3:2|600x400&s=36)

## HTML

### Semantic Markup

The introduction of HTML5 brought us developers a slew of new semantic tags. Rather than have to put everything in non-descript `<div>` containers, use semantic tags whenever possible. Tags like `<section>`, `<article>`, `<aside>`, `<header>`, `<footer>`, `<nav>`, etc. make the purpose and meaning of the content they contain clear not just to your fellow developers, but for screen-readers and search engines as well.

For a list of all valid HTML5 tags, please consult the [MDN element reference chart](https://developer.mozilla.org/en-US/docs/Web/HTML/Element).

### Aria Tags & Accessibility

Get reading!

[https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA]()

## Styling

### SASS/SCSS
We use [Sassy CSS (SCSS)](http://sass-lang.com/documentation/file.SCSS_FOR_SASS_USERS.html) for styling. SCSS files are stored in the directory for each pattern and imported in `/source/assets/css/styles.scss`,

### Name classes using BEM
Class names and hierarchy follow the [BEM (Block Element Modifier)](http://getbem.com/) namespacing methodology to facilitate code sharing among designers and developers. For easier reading and more concise class names, we use the abridged syntax recommended in the [18F Front End Guide](https://frontend.18f.gov/#bem).

### Responsive implementation using Breakpoint-Sass
All patterns in the AMA Style Guide are fully responsive. We use [Breakpoint-Sass](http://breakpoint-sass.com/) to manage our media queries. Breakpoint is fairly simple to use and has a very thorough [wiki](https://github.com/at-import/breakpoint/wiki) explaining its useage and capabilities.

### Sass-Grid
Some of our layouts currently utilize the [Sass-grid](https://github.com/digitaledgeit/sass-grid) grid system. Sass-grid is a very lightweight, flexbox-based grid system.

### Using Placeholders
When appropriate, please extend placeholders rather than classes:

Placeholder selectors will not show up in the generated CSS. Only the selectors that extend them will be included in the output. This means that if a placeholder exists only to be extended by other classes, our compiled CSS won't get bloated by unused classes.  Example:

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

Any relevant javascript for a pattern should be stored in the pattern's own folder, along with its template and SCSS.

We use jQuery in our applications, so you should make sure your pattern's .js file begins with an immediately invoked function expression that accepts the jQuery library as a parameter like so:



	(function($) {
		//your pattern javascript here
	}(jQuery);

If your javascript expects certain elements to be present in the DOM, make sure you wrap the JS in an init function of some sort and check that the elements exist before initializing your script! Pattern Lab doesn't automagically encapsulate your javascript, so wrapping your js thusly prevents an abundance of errors if your selectors happen to be missing from a particular page of the style guide.



## Annotation and Documentation

Each pattern should have its own accompanying [Markdown](https://daringfireball.net/projects/markdown/) file that should always contain a useful description of the pattern you are creating, as well as links to the relevant JIRA ticket/Github issues relating to the pattern. This is required to provide context in the event of uncertainty about why a pattern was created or how it ought to be used.

Pattern Lab also provides the ability to [add annotations](http://patternlab.io/docs/pattern-adding-annotations.html) to your patterns. Use these annotations when you need to add explanation about how a pattern is implemented.
