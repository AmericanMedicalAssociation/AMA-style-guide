# Living Style Guide for AMA
This is the living style guide for the American Medical Association. It is a platform-agnostic tool to empower employees and vendors to maintain consistent design and hierarchy throughout the AMA digital ecosystem.

This style guide is a compilation of [atomic components](http://bradfrost.com/blog/post/atomic-web-design/) that have been specifically tailored to the needs of AMA. By documenting and assembling this collection of patterns, we are able to build consistently, reuse code, and [see all of our patterns in one place](https://americanmedicalassociation.github.io/AMA-style-guide/).

## To use the Style Guide on a project:
- Grab the [latest release](https://github.com/AmericanMedicalAssociation/AMA-style-guide/releases)
- Open the `.zip` into your project
- Compile the production files:
  - `cd /styleguide`
  - `gulp serve`
- Link to the production files at `styleguide/public/assets/`

## To begin working:
**Environment setup (mac)**

 - Have [`homebrew`](https://brew.sh/) installed
 - `brew install nvm`
 - `nvm install v7.10.0` (or some relatively recent node version. Note 8.0.0 has a fatal bug with require-dir module)
 - `nvm use 7.10.0`

**Just the first time:**
- `cd styleguide`
- `composer install`
- `npm install`
- `sudo npm install -g gulp` 
  - This will install gulp globally on your machine. If you don't have privileges, don't want to install globally, or need to manage multiple projects using `gulp`, you can invoke `gulp` via `./node_modules/.bin/gulp serve` instead of directly.

**For ongoing development**
- `gulp serve` to watch files and display the resulting page in your local browser.
- Occasionally things might stop refreshing well. If that happens, just kill (`Control-C`) gulp and re-run.
- `gulp scss-lint` will check your SCSS for code quality. Please ensure your code lints successfully. A few notes:
  - We're using autoprefixer to get all the latest and greatest vendor prefixes. You should not need to use vendor prefixes in your code.
  - If you do need a vendor prefix (for device-specific changes, like `-webkit-appearance`) you can [disable linting for those lines](https://github.com/stylelint/stylelint/blob/master/docs/user-guide/configuration.md#turning-rules-off-from-within-your-css).

**To deploy changes to GitHub Pages**
- `gulp deploy` to build the production ready code, and then copy `/public` to the `gh-pages` branch and push.

Occasionally, you might have to make a change to CSS and let the new stylesheet get pushed into the browser to see recent changes, but otherwise this should take care of everything: moving assets, compiling SASS, getting BrowserSync running, and more.

**To mark a new release of the Style Guide**

_this should only be run on the `develop` branch_
- Make sure you are running the most up-to-date code
  - Updates will be rejected if they are non-fast-forward
- `gulp release` to build the files correctly, update version information, cut a tag, and deploy the files to `gh-pages`
- Navigate to the [latest release](https://github.com/AmericanMedicalAssociation/AMA-style-guide/releases) to see the new release and add notes.

Initial config via [TutsPlus](https://webdesign.tutsplus.com/tutorials/combining-pattern-lab-with-gulp-for-improved-workflow--cms-22187).

## Troubleshooting:
### Make sure your npm dependencies are up to date
If you run unto an unexpected error, you might just be missing a dependency
- Run `npm install` from the `styleguide` directory to grab any missing dependencies.

### Make sure node and npm are up to date(-ish)
You might have to do any or all of these
- Update node
```
sudo npm cache clean -f
sudo npm install -g n
sudo n stable
```
- Update npm
```
sudo npm install -g npm
```
- Rebuild npm to recompile any outdated packages.
```
npm rebuild
```

## What's going on here?
### Icons
Icons are being generated using [Grunticon](https://github.com/filamentgroup/grunticon) with the [Gulpicon](https://github.com/filamentgroup/gulpicon) wrapper. This generates a three-tier system of fallbacks, which are controlled by a JS-based loader [full desc](https://github.com/filamentgroup/grunticon#a-mystical-css-icon-solution).

New icons can be places in `source/assets/icons/svg`. When `gulp icons` is run, the process will [minify the SVGs](https://www.npmjs.com/package/gulp-svgmin) then run `gulpicon` using the config and template in the icons directory, finally outputting everything in `public/assets/icons/`. The loader and initialization code are in [`_00-head.twig`](./styleguide/source/_meta/_00-head.twig).

### Responsive implementation
We are using [Breakpoint](http://breakpoint-sass.com/) to handle media queries for responsive implementation.

The first time you run `npm install` the dependency will be installed, but if you run into an error, running `npm install` again should fix the issue.

### Layouts

This style guide provides commonly used layouts, including one column, two column, two column heavy left (a wider left column and narrow right column), and three column layouts. The layouts are located in Molecules under Layouts and utilize flexbox.

To apply a layout, first add the <code>layout</code> class to the template or page container. This class provides the 12 column structure the grid and subsequent layouts rely on. To then apply a specific layout, add that layout's <code>layout_number_up</code> class to the top level element of the pattern.

For example, to use the side-by-side Two Up Layout, add the <code>layout_two_up</code> class to the top level element, then add the <code>layout_two_up-primary</code> class to the element you would like to appear in the first column, and add the <code>layout_two_up-secondary</code> class to the element you would like to appear in the second column.

Note: you should not need to nest elements with class <code>.layout</code>.

The <code>.layout</code> and <code>.layout_number_up</code> classes can be added to container elements both in individual patterns (i.e. organisms) and in the Twig templates that include them (e.g. templates). In general, if a specific pattern can be assumed to always use the same layout, it's fine to include the layout within that pattern.

### Placeholder Images
Images should only be committed to the style guide when they are providing "real representative content" in [Pattern Lab "Page" components](http://atomicdesign.bradfrost.com/chapter-2/#pages). Otherwise, dynamic placeholder images should be used. Placeholders should be generated in the form `https://ipsumimage.appspot.com/600x400?l=3x2|600x400&s=36` using the reduced ratio of the image for the benefit of the content team and the rendered dimensions of the image for the benefit of development teams implementing the pattern in a CMS.

Breaking this url down:
- `http://ipsumimage.appspot.com/`: the image generator. More [documentation available there](http://ipsumimage.appspot.com/).
- `600x400` the width x height with which the placeholder image will be generated
- `?l=3x2|600x400` the label text, with a pipe (|) separating lines. Our images should use [ratio]|[dimensions].
- `&s=36` the text size. This should only be tweaked if necessary.\

![This is a placeholder image](https://ipsumimage.appspot.com/600x400?l=3x2|600x400&s=36)
