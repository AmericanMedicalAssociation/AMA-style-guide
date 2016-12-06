# Living Style Guide for AMA
## To begin working:

**Just the first time:**
- `cd styleguide`
- `composer install`
- `npm install`

**For ongoing development**
- `gulp icons` to generate the icons, since that process [isn't stream-able yet](https://github.com/filamentgroup/gulpicon/issues/1).
- `gulp serve` to watch files and display the resulting page in your local browser.
- Occasionally things might stop refreshing well. If that happens, just kill (`Control-C`) gulp and re-run. 

**To deploy changes to GitHub Pages**
- `gulp` to generate things if you haven't recently.
- `gulp deploy` to copy /public to the gh-pages branch and push.

Occasionally, you might have to make a change to CSS and let the new stylesheet get pushed into the browser to see recent changes, but otherwise this should take care of everything: moving assets, compiling SASS, getting BrowserSync running, and more.

Initial config via [TutsPlus](https://webdesign.tutsplus.com/tutorials/combining-pattern-lab-with-gulp-for-improved-workflow--cms-22187).

## Troubleshooting:
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
