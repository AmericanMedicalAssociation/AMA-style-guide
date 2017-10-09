## Working with Pattern Lab
1. All work is done in the `/styleguide/source` directory.
    - We use [BEM](http://getbem.com/introduction/) to structure our scss which gets compiled to css during build and automatically with the gulp task running.
    - Most patterns will have a `.twig` [markup file](https://twig.sensiolabs.org/), `.json` default [data file](http://patternlab.io/docs/data-pattern-specific.html), and `.md` [documentation file](http://patternlab.io/docs/pattern-documenting.html) in the `/styleguide/source/_patterns` directory.
    - If a pattern has styles associated with it, the corresponding `.scss` files can be found in the corresponding folder.
     - If a pattern has js functionality associated with it, the corresponding `.js` file can be found in the `/styleguide/source/assets/js/` directory.
    - These assets will automatically recompile and the browser will refresh as you save changes.
1. For example (All .json should follow camelCase and all classes should be prefixed with .ama__) 
    - page-title.json -- `{
                            "pageTitle": {
                              "text": "Page Title"
                            }
                          }`
    - page-title.twig -- `<h1 class="ama__page-title">{{ pageTitle.text }}</h1>`
    - _page-title.scss -- `.ama__page-title {
                            // styles
                            // styles
                            // &__<child>
                          }`
                          