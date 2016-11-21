# Living Style Guide for AMA
## To begin working:

**Just the first time:**
- `cd styleguide`
- `composer install`
- `npm install`

**For ongoing development**
- `gulp serve` to watch files and display the resulting page in your local browser.

**To deploy changes to GitHub Pages**
- `gulp` to generate things if you haven't recently.
- `gulp deploy` to copy /public to the gh-pages branch and push.

Occasionally, you might have to make a change to CSS and let the new stylesheet get pushed into the browser to see recent changes, but otherwise this should take care of everything: moving assets, compiling SASS, getting BrowserSync running, and more.

Initial config via [TutsPlus](https://webdesign.tutsplus.com/tutorials/combining-pattern-lab-with-gulp-for-improved-workflow--cms-22187).
