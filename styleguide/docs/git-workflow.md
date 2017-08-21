# Using Git

This style guide relies on [Git](https://git-scm.com/) for version control.

## Help with Git

Emma Jane Westby has created wonderful videos and resources about using Git called [Git for Teams](http://gitforteams.com/).

## Creating branches

This project follows a git branching workflow using `feature/branchname`, `bugfix/branchname`, `hotfix/branchname`. When creating a new branch, it is helpful to base it off of `develop`. If you would like to include commits from a different branch that has not been merged, include those changes by checking out a new branch that is based on `develop`, and then use `git rebase origin/NameOfBranchWithDesiredChanges`. This often works out better in the long run instead of 'chaining' feature branches off of each other directly.

## Common Git Commands

### Pull or Fetch?

In order to get upstream changes that have been merged, you can use `git fetch` followed by `git merge`, or alternatively use `git pull`. A fetch allows you to see what has changed, and then to decide if you would like to add those changes in your branch with merge. Use `git fetch` then `git merge origin/branchname` to bring the branch up to date.

Using `git pull` is `git fetch` followed immediately by `git merge FETCH_HEAD` in one step. In some situations, `git pull` may be suitable.
