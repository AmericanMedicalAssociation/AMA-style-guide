# Creating a Release

This section describes three types of releases:

- **Cutting a release of the Style Guide for public consumers**
- **Deploying changes to github pages _only_**
- **Deploying changes for _only_ consumption by our D8 site**

#### To cut a release of the Style Guide for public consumers

_WARNING: This should only be run on the `develop` branch!**\***_

- Make sure you are running the most up-to-date code
  - Updates will be rejected if they are non-fast-forward
- Update `package.json` with the new version number.
- `gulp release` to build the files correctly, cut a tag, and deploy the files to `gh-pages`, `dev-assets`, and `master`.
- Navigate to the [latest release](https://github.com/AmericanMedicalAssociation/AMA-style-guide/releases) to see the new release and add notes.

Initial config via [TutsPlus](https://webdesign.tutsplus.com/tutorials/combining-pattern-lab-with-gulp-for-improved-workflow--cms-22187).

**\*Note:** To base a release on a specific commit, for example when the `develop` branch has had other PRs committed that should not be included in the release, do the following:

1. Check out the commit from which you'd like to deploy.
2. Run `gulp release` to deploy the release from that commit.

#### To deploy changes to github pages _only_

- `gulp deploy` to build the production ready code and push to the `gh-pages` branch for display on [https://americanmedicalassociation.github.io/AMA-style-guide/](https://americanmedicalassociation.github.io/AMA-style-guide/).

#### To deploy changes _only_ for consumption by our D8 site

- `gulp drupal-deploy` to deploy changes to the `dev-assets` branch for consumption by Drupal or another CMS.
