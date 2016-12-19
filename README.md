# Living Style Guide for AMA
## To begin working:

**Just the first time:**
- `cd styleguide`
- `composer install`
- `npm install`

**For ongoing development**
- `gulp serve` to watch files and display the resulting page in your local browser.
- Occasionally things might stop refreshing well. If that happens, just kill (`Control-C`) gulp and re-run.

**To deploy changes to GitHub Pages**
- `gulp` to generate things if you haven't recently.
- `gulp deploy` to copy /public to the gh-pages branch and push.

Occasionally, you might have to make a change to CSS and let the new stylesheet get pushed into the browser to see recent changes, but otherwise this should take care of everything: moving assets, compiling SASS, getting BrowserSync running, and more.

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

The first time you run `npm install` the dependency will be installed, but if you run into an error, running `npm install` again should fix the issued.
