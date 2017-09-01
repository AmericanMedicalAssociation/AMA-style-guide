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

### Layouts

The layouts molecules are now deprecated. To give structure to organisms and templates, please follow the grid and columns method outlined below.


### Grids and columns

#### Basics

To use columns to control a template or organism's structure, start by adding an element with a `.grid` or `.container-with-grid` class (we'll get to the difference a little later). This grid instantiates a flexbox wrapper for descendant elements.

Then add elements with `.col-width-x` classes, where 'x' should be replaced by the number of columns you want the element to span. We use a 12 column grid, so for any given `grid` container, make sure that the `col-width-x` numbers add up to a total of 12.

**Example:**

```
<a href="#" class="grid">
  <div class="col-width-8">
    {% include '09-text.twig' %}
  </div>
  <div class="col-width-4">
    {% include '09-text.twig' %}
  </div>
</a>
```

The `col-width-x` classes default to `width:100%` at our mobile breakpoint (in other words, multiple columns collapse into a single-column layout). If you need to specify a different mobile behavior for your pattern (e.g. in order to use different column widths or breakpoints), apply the `@include grid()` and `@include grid-_unit--cols(x)` mixins to your named classes* instead of using the `.grid` and `.col-width-x` classes:

[ block quote example here yee ]

\* note: for the sake of clarity, avoid using a `.grid` class with a `@include grid-_unit-cols(x)` mixin in a named class, or vice versa a `.column-width-x` class with an `@include grid()` parent. 

[ example quote here of bad example ] 

Both the `.grid` class and the `@grid` mixin leverage [sass-grid](https://github.com/digitaledgeit/sass-grid). Sass-grid is a very lightweight, flexbox-based grid system.

#### `.container` vs `.container-with-grid` vs `.grid`

`.container`: has our default max-width, margins, and gutters applied. Useful for ensuring that patterns included in a template all have uniform spacing.

`.grid`: has no set max-width or default gutters or margins. This just applies the flexbox class to an element.

`.container-with-grid`: applies the default margins and gutters and instantiates flexbox.

#### Gutters

If you need to specify gutters on a certain element, use the `@include gutters()` mixin or the `$gutter` and `$gutter-mobile` responsive variables.

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

Javascript in the style guide is directly consumed by Drupal, and as such, you need to follow the instructions below to properly set up your scripts . This will allow for Javascript to be shared between the style guide and Drupal. More context behind this method can be found on [this pull request](https://github.com/palantirnet/butler/pull/41) and [this doc](https://github.com/palantirnet/butler/blob/master/docs/JS.md).

### Creating a new, custom Javascript file
1. Create a new Javascript file in the corresponding pattern directory with the same name as the pattern (e.g. `test-pattern.twig` would get `test-pattern.js`).
2. Copy and paste the [Javascript file template](./JS_TEMPLATE.js) into your new file. (The template is located at /styleguide/docs/JS_TEMPLATE.js)
3. Update the potions in curly brackets: the file description comment, the name of the behavior and the contents of the script you're writing. You many name your behavior anything you like; it just needs to be unique.
4. Your JS will be automatically sucked up by gulp and compiled into the project.

This wrapper includes an immediately invoked function expression that accepts the jQuery library as a parameter. If your javascript expects certain elements to be present in the DOM, make sure you wrap the JS in an init function of some sort and check that the elements exist before initializing your script! Pattern Lab doesn't automagically encapsulate your javascript, so wrapping your js thusly prevents an abundance of errors if your selectors happen to be missing from a particular page of the style guide.

### Using this JS
The [drupal-attach-behaviors.js](../source/assets/js/drupal-attach-behaviors.js) script  mimics the functionality from the Drupal JS API. This allows us to write our scripts as Drupal behaviors and use them in the style guide. With `drupal-attach-behaviors.js` included in the `<head>` of your style guide, the scripts work properly—both in Drupal and in the style guide—with the scripts living in only one location. This inclusion is done automatically in the style guide.

If you choose to use individual JS files from this repo, you'll need to include `drupal-attach-behaviors.js` in the `<head>` of your application, before any of the individual files.

## Annotation and Documentation

Each pattern should have its own accompanying [Markdown](https://daringfireball.net/projects/markdown/) file that should always contain a useful description of the pattern you are creating, as well as links to the relevant JIRA ticket/Github issues relating to the pattern. This is required to provide context in the event of uncertainty about why a pattern was created or how it ought to be used.

Pattern Lab also provides the ability to [add annotations](http://patternlab.io/docs/pattern-adding-annotations.html) to your patterns. Use these annotations when you need to add explanation about how a pattern is implemented.
