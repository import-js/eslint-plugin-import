# Contributing

Thanks for your interest in helping out! Here are a **few** _weird_ tricks to ~~cut your mortgage in half~~ maximize the global net efficiency of your efforts!

## TL;DR: Checklist

When opening an [issue](#issues):
- [ ] search open/closed issues
- [ ] discuss bug/enhancement in new or old issue

[PR](#prs) time:
- [ ] write tests
- [ ] implement feature/fix bug
- [ ] update docs
- [ ] make a note in change log

Remember, you don't need to do it all yourself; any of these are helpful! 😎

## Issues

### Search open + closed issues for similar cases.

  You may find an open issue that closely matches what you are thinking. You may also find a closed issue with discussion that either solves your problem or explains why we are unlikely to solve it in the near future.

  If you find a matching issue that is open, and marked `accepted` and/or `help wanted`, you might want to [open a PR](#prs).

### Open an issue.

  Let's discuss your issue. Could be as simple as unclear documentation or a wonky config file.
  If you're suggesting a feature, it might exist and need better documentation, or it might be in process. Even given those, some discussion might be warranted to ensure the enhancement is clear.

  You're welcome to jump right to a PR, but without a discussion, can't make any guarantees about merging.

  That said: sometimes seeing the code makes the discussion clearer.😄

This is a helpful contribution all by itself. Thanks!

## PRs

If you would like to implement something, firstly: thanks! Community contributions are a magical thing. Like Redux or [the flux capacitor](https://youtu.be/SR5BfQ4rEqQ?t=2m25s), they make open source possible.

**Working on your first Pull Request?**
You can learn how from this _free_ series [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github).

Here are some things to keep in mind when working on a PR:

#### Tests

A PR that is just failing test cases for an existing issue is very helpful, as this can take as much time (if not more) as it takes to implement a new feature or fix a bug.

If you only have enough time to write tests, fantastic! Submit away. This is a great jumping-off point for a core contributor or even another PR to continue what you've started.

#### Docs

For enhancements to rules, please update the docs in `docs/rules` matching the rule filename from `src/rules`.

Also, take a quick look at the rule summary in [README.md] in case it could use tweaking, or add a line if you've implemented a new rule.

Bugfixes may not warrant docs changes, though it's worth skimming the existing docs to see if there are any relevant caveats that need to be removed.

#### Changelog

Please add a quick blurb to the [**Unreleased**](./CHANGELOG.md#unreleased) section of the change log. Give yourself some credit, and please link back to the PR for future reference. This is especially helpful for resolver changes, as the resolvers are less frequently modified and published.

Note also that the change log can't magically link back to Github entities (i.e. PRs, issues, users) or rules; there are a handful of footnote URL definitions at the bottom. You may need to add one or more URL if you've square-bracketed any such items.

## Code of Conduct

Please familiarize yourself with the [Code of Conduct](https://github.com/import-js/.github/blob/main/CODE_OF_CONDUCT.md).

[README.md]: ./README.md