# American Medical Association - Style Guide
## A living style guide for the AMA.

## Requirements

* VMWare, or [virtualBox](https://www.virtualbox.org/wiki/Downloads) >= 5.0
* [vagrant](https://www.vagrantup.com/) >= 1.8
* [ansible](https://github.com/ansible/ansible) `brew install ansible`
* [vagrant-hostmanager](https://github.com/smdahlen/vagrant-hostmanager) `vagrant plugin install vagrant-hostmanager`
* [vagrant-auto_network](https://github.com/oscar-stack/vagrant-auto_network) `vagrant plugin install vagrant-auto_network`
* [vagrant-serverspec](https://github.com/jvoorhis/vagrant-serverspec) `vagrant plugin install vagrant-serverspec`
`

If you have been running a previous version of Vagrant you may need to do: `vagrant plugin update` to ensure that you can install the plugins.

## Getting Started

1. From inside the project root, run:
 * `composer install`
 * `vagrant up`
 * If you are running Vagrant 1.8.7 and macOS Sierra, you might run into an error when running `vagrant up`. Follow [these instructions](http://stackoverflow.com/a/40474205/2566038) to fix the issue.
1. You will be prompted for the administration password on your host machine. Obey.
1. SSH in and install the site:

  ```
    vagrant ssh
    cd /var/www/ama-style-guide.local
    vendor/bin/phing build install migrate
  ```

1. Visit [ama-style-guide.local](http://ama-style-guide.local) in your browser of choice.

## How do I work on this?

1. From inside the project root, type `vagrant ssh`
1. Navigate to `/var/www/ama-style-guide.local`
1. Follow instructions for Butler below.

This is your project directory; run `composer` and `drush` commands from here, and run build tasks with `vendor/bin/phing`. Avoid using git from here, but if you must, make sure you configure your name and email for proper attribution, and [configure your global .gitignore](https://github.com/palantirnet/development_documentation/blob/master/guidelines/git/gitignore.md):

```
git config --global user.email 'me@palantir.net'
git config --global user.name 'My Name'
```

## How do I Drupal?

We're not doing Drupal in this repo.

## How do I prototype?

### Butler!

This project uses Butler. If you haven't installed the `npm` dependencies yet, do that now:

```
vagrant ssh
cd /var/www/mcor.local
npm install
```

## What does this Butler do?

* `npm run butler`

  This is the default task. This will watch your sass/sculpin files for changes and compile/build accordingly. It will also flag any sass linting errors before compiling. It will output CSS that has been been minified and optimized.

* `npm run butler -- sass`

  Just compile the sass. You can also use this syntax to run any task from the Gulpfile.

* `npm run tests`

  This is the testing task it will run linters as their own tasks. To learn more about configuring and customizing the linters for Butler check the [linters documentation](/docs/LINTERS.md).

  This task also checks for WCAG 2.0AA compliance using the [gulp-accessibility](https://github.com/yargalot/gulp-accessibility) plugin.

* `npm run deploy`

  This is a task to deploy the static styleguide to GitHub pages.

  Butler will build a Sculpin production artifact to `styleguide/output_prod` and deploy the production artifact to `gh-pages` branch of the repo defined in the `conf/butler.defaults.js`. Each commit for this process will default to the message: "Updated with Butler - [timestamp]".

  You may want to create a `sculpin_site_prod.yml` to define the site URL once deployed. You can find out more information about environment aware configuration for Sculpin [here](https://sculpin.io/documentation/configuration/).

  *Note: When you are deploying, Butler will ask you for your GitHub credentials at least once, possibly multiple times. Enter your own GitHub credentials as prompted.*

## Troubleshooting

If, on browsing to `http://ama-style-guide.local`, you get the following error:
> ama-style-guide.local’s server DNS address could not be found.

Then `vagrant up` may have failed half way through. When this happens, the `vagrant-hostmanager` plugin does not add the hostname to `/etc/hosts`. Try halting and re-upping the machine: `vagrant halt && vagrant up`. Reload is not sufficient to trigger updating the hosts file.
