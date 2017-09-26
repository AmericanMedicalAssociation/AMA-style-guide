# Code Conventions

## Contents
- [Templating](#templating)
  - [Intro to Twig](#intro-to-twig)
  - [Placeholder Images](#placeholder-images)
  - [Use You Some JSON](#use-you-some-json)
  - [Pseudo-Patterns](#pseudo-patterns)
  - [Pattern Lab reserved words](#pattern-lab-reserved-words)
- [HTML](#html)
  - [Semantic Markup](#semantic-markup)
  - [Aria Tags and Accessibility](#aria-tags-and-accessibility)
- [Styling](#styling)
  - [SASS/SCSS](#SASS/SCSS)
  - [Name classes using BEM](#name-classes-using-bem)
  - [Responsive implementation using Breakpoint-Sass](#responsive-implementation-using-breakpoint-sass)
  - [Grids and columns](#grids-and-columns)
- [Javascript](#javascript)
  - [Creating a new, custom Javascript file](#creating-a-new-custom-javascript-file)
  - [Using this js](#using-this-js)
- [Annotation and Documentation](#annotation-and-documentation)

## Templating

### Intro to Twig
Markup for each pattern in our style guide is created with [Twig](http://twig.sensiolabs.org/), a PHP-based HTML templating engine. Twig allows us to easily include patterns inside of other patterns.

You can view both the Twig syntax and the rendered HTML markup for a pattern by clicking on the gear icon in the upper right of every page and selecting "Show Pattern Info."

### Placeholder Images
Images should only be committed to the style guide when they are providing "real representative content" in [Pattern Lab "Page" components](http://atomicdesign.bradfrost.com/chapter-2/#pages). Otherwise, dynamic placeholder images should be used. Placeholders should be generated in the form `https://ipsumimage.appspot.com/600x400?l=3:2|600x400&s=36` using the reduced ratio of the image for the benefit of the content team and the rendered dimensions of the image for the benefit of development teams implementing the pattern in a CMS.

Breaking this url down:

- `http://ipsumimage.appspot.com/`: the image generator. More [documentation available there](http://ipsumimage.appspot.com/).
- `600x400` the width x height with which the placeholder image will be generated
- `?l=3:2|600x400` the label text, with a pipe (|) separating lines. Our images should use [ratio]|[dimensions].
- `&s=36` the text size. This should only be tweaked if necessary.

![This is a placeholder image](https://ipsumimage.appspot.com/600x400?l=3:2|600x400&s=36)

### Use You Some JSON

Patterns revolve around content. The Twig templating engine, combined with Pattern Lab's [data-inheritance plugin](https://github.com/pattern-lab/plugin-php-data-inheritance) which allows us to load data based on included patterns or pseudo-patterns, give us a number of ways to deal with creating and utilizing placeholder content.

Our preferred method is to use JSON files for placeholder content when existing defaults are not suitable. Not only does this make it easier to organize data rather than packing a bunch of placeholder text into the template itself, but it's also critical for leveraging pseudo-patterns which utilize _one_ twig template but _several_ different json files to trigger variations in layout (pseudo-patterns are covered below).

**Example:**

.twig

```twig
<div class="banner-cta-no-stacking banner-cta-no-stacking-left">
    {% include 'atoms-h2' with { 'content': ctaBanner.heading, 'class': 'banner-cta-no-stacking_title h1' } %}
    <div class="banner-cta-no-stacking_image" style="background-image: url('{{ ctaBanner.image }}');"></div>
    <div class="banner-cta-no-stacking_text">
        {% include 'atoms-paragraph' with { content: ctaBanner.content } %}
        {% include 'atoms-button-link' with { content: ctaBanner.buttonText, class: 'button-small banner-cta-no-stacking_button' } %}
    </div>
</div>
```

.json

```json
  "ctaBanner": {
    "heading": "Accessible anywhere, anytime",
    "image": "https://ipsumimage.appspot.com/600x400?l=3:2|600x400&s=36",
    "content": "Pede mi consectetuer, consectetuer laoreet dui cursus id, nulla adipiscing",
    "buttonText": "Start a Course"
  }
```

**Avoid:**

.twig

```twig
<div class="banner-cta-no-stacking banner-cta-no-stacking-left">
    {% include 'atoms-h2' with { 'content': 'Lorem ipsum dolor sit amet', 'class': 'banner-cta-no-stacking_title h1' } %}
    <div class="banner-cta-no-stacking_image" style="background-image: url('https://ipsumimage.appspot.com/600x400?l=3:2|600x400&s=36');"></div>
    <div class="banner-cta-no-stacking_text">
        {% include 'atoms-paragraph' with { content: 'Dolor posuere tempor quam et, maecenas auctor hac urna ac eu, sed in.' } %}
        {% include 'atoms-button-link' with { content: 'CTA button', class: 'button-small banner-cta-no-stacking_button' } %}
    </div>
</div>
```

### Pseudo-Patterns

[Pseudo-patterns](http://patternlab.io/docs/pattern-pseudo-patterns.html) are Pattern Lab's way of easily managing closely related patterns that have multiple variants. In the case of our style guide, we typically use pseudo-patterns for patterns where the data structures are consistent, but content might be displayed in differently if certain conditions are met. 

Imagine that a CMS serving data to a pattern uses just one data model/content type, but has several different possible ways that content should be displayed. For example:
* The content must be displayed in different places across the page/site
* The content must be displayed differently if certain fields are or are not populated
* The content must be displayed differently depending on whether or not a certain kind of user is logged in

In Drupal, we often use [*display/view modes*](https://www.drupal.org/docs/8/api/entity-api/display-modes-view-modes-and-form-modes) to display data in cases like these, so building different view modes in Drupal can often be a good case for using pseudo-patterns in the Style Guide. There are other possible use cases for pseudo-patterns, such as showing pattern states, but this is just the most common example.

When creating pseudo patterns, first make a base pattern template that includes logic for when to and when to not display various elements depending on the data in the content model. Below is an example of the base Twig template for a pattern named **topic-related-content.twig** with pseudo-variants:

```twig
{% set applyGrid = related_content.image ? "grid" : "" %}
 <div class="topic-related-content {{applyGrid}}">
   {% if related_content.image %}
     <div class="col-width-6">
       {% include 'atoms-landscape-3x2' with { 'src': related_content.image } %}
     </div>
     <div class="col-width-3">
       {% include 'atoms-h2' with { 'content': related_content.title, 'class': 'topic-related-content_title' } %}
       {% include 'atoms-link-blue' with { 'content': 'Sed nuc', 'class': 'topic-related-content_link' } %}
     </div>
   {% else %}
     {% include 'atoms-h2' with { 'content': related_content.title, 'class': 'topic-related-content_title' } %}{% include 'atoms-link-blue' with { 'content': 'Link text', 'class': 'topic-related-content_link' } %}
   {% endif %}
 </div>
```

The default json, stored in a file named **topic-related-content.json**, looks like this:

```json
{
  "related_content": {
      "title": "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
    }
}
```

A variant named **topic-related-content~with-image.json** might look like this:

```json
{
  "related_content": {
      "title": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "image": "https://ipsumimage.appspot.com/279x186?l=3:2|279x186&s=36"
    }
}
```

With conditional statements and data with the same structure, but varying content, pseudo patterns let us re-use markup and reduce the number of templates we need for closely related patterns.

Our version of pattern lab includes the [data-inheritance plugin](https://github.com/pattern-lab/plugin-php-data-inheritance) which allows patterns to inherit data from patterns within its lineage, making the use of pseudo-patterns even more powerful.

In addition to [the official docs](http://patternlab.io/docs/pattern-pseudo-patterns.html) on pseudo-patterns, there is [a good Smashing article](https://www.smashingmagazine.com/2016/07/building-maintaining-atomic-design-systems-pattern-lab/#pseudo-patterns) describing pseudo-patterns in more detail.

### Pattern Lab reserved words

In general, you can create any number of variables within your templates to use for passing and storing data. However, there are some Pattern Lab reserved words. Below are the most important:

#### Link

`link` is a special word in Pattern Lab used for linking patterns to one another rather than hardcoding paths. You should not use it as a variable name when passing data to a pattern.

**Example:**

```twig
<li>{% include 'atoms-logo' with {'href': 'http://example.com' } %}</li>
                                   ----
```

**Avoid:**

```twig
<li>{% include 'atoms-logo' with {'link': 'http://example.com' } %}</li>
                                   ----
```

## HTML

### Semantic Markup

The introduction of HTML5 brought us developers a slew of new semantic tags. Rather than have to put everything in non-descript `<div>` containers, use semantic tags whenever possible. Tags like `<section>`, `<article>`, `<aside>`, `<header>`, `<footer>`, `<nav>`, etc. make the purpose and meaning of the content they contain clear not just to your fellow developers, but for screen-readers and search engines as well.

For a list of all valid HTML5 tags, please consult the [MDN element reference chart](https://developer.mozilla.org/en-US/docs/Web/HTML/Element).

### Aria Tags and Accessibility

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

The style guide uses two primary methods for applying a [CSS Grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout): 1) using our custom `.grid` and `.col-width-x` classes or 2) using the sass mixins `grid()` and `grid__unit--cols(x)`.

Under the hood, both the `.grid` class and the `@grid` mixin leverage [sass-grid](https://github.com/digitaledgeit/sass-grid), which is a very lightweight, flexbox-based grid system. Flexbox enables us to created nested, responsive grids and gives us a great deal of control over our grid elements. the `sass-grid` library makes using flexbox simple, while also allowing for graceful degradation where flexbox is not supported. When we use the classes versus using the mixins depends on the specific needs of the pattern you are creating.

#### Choosing the right method

##### Class Method

The class method is the preferred method for adding columns to control a template or organism's structure. Start by adding an element with a `.grid` or `.container-with-grid` class (we'll get to the difference a little later). This grid instantiates a flexbox wrapper for descendant elements.

Then add elements with `.col-width-x` classes, where 'x' should be replaced by the number of columns you want the element to span. We use a 12 column grid, so for any given `.grid` container, make sure that the `.col-width-x` numbers add up to a total of 12.

**Example:**

```twig
<a href="#" class="grid">
  <div class="col-width-8">
    {% include '09-text.twig' %}
  </div>
  <div class="col-width-4">
    {% include '09-text.twig' %}
  </div>
</a>
```

The `col-width-x` classes include default left and right padding. At our mobile breakpoint, they default to `width:100%` (in other words, multiple columns collapse into a single-column layout).

##### Mixin Method
If you need to specify different gutters, or use a different mobile behavior for your pattern , apply the `grid()` and the `grid__unit--cols(x)` _mixins_ to your named classes rather than using the `.grid` and `.col-width-x` _classes_.

**Example:**

Markup

```twig
<a href="#" class="news-section">
  <div class="news-section_left">
    {% include '09-text.twig' %}
  </div>
  <div class="news-section_right">
    {% include '09-text.twig' %}
  </div>
</a>
```

SCSS

```css
.news-section {
  @include grid(); 
}
.news-section_left {
  @include grid__unit--cols(8);
}
.news-section_right {
  @include grid__unit--cols(4);
}
```

##### Warning!

**Avoid** mixing usage of the `.grid` _class_ and the `grid__unit--cols(x)` _mixin_. Similarly, do not combine the `grid()` _mixin_ with the `.col-width-x` _classes_. Parent and child elements should be consistent--use either classes **or** mixins but **not both**. This is to maintain clarity and make it more intuitive for a developer to see how the grid's being implemented in a given pattern.

**Avoid:**

Markup

```twig
<a href="#" class="news-section grid">
  <div class="news-section_right">
    {% include '09-text.twig' %}
  </div>
  <div class="news-section_left">
    {% include '09-text.twig' %}
  </div>
</a>
```

SCSS

```css
.news-section_right {
  @include grid__unit--cols(8);
}
.news-section_left {
  @include grid__unit--cols(4);
}
```

#### `.container` vs `.container-with-grid` vs `.grid`

`.container`: has our default max-width, margins, and gutters applied. Useful for ensuring that patterns included in a template all have uniform spacing.

`.grid`: has no set max-width or default gutters or margins. This just applies the flexbox class to an element.

`.container-with-grid`: applies the default margins and gutters and instantiates flexbox.

#### Gutters

If you need to specify gutters on a certain element, use the `@include gutters()` mixin or the `$gutter` and `$gutter-mobile` responsive variables.

### Using Placeholders
When appropriate, please extend placeholders rather than classes:

Placeholder selectors will not show up in the generated CSS. Only the selectors that extend them will be included in the output. This means that if a placeholder exists only to be extended by other classes, our compiled CSS won't get bloated by unused classes.  Example:

```css
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
```

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
