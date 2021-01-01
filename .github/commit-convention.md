# Git Commit Message Convention

> This is adapted from [Angular's commit convention](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular).

## TL;DR

Messages must be matched by the following regex:

```js
;/^(?:revert: )?(?:wip|feat|fix|docs|style|refactor|perf|test|build|ci|chore|merge|release)(\(.+\))?: .{1,50}/
```

A commit-msg sample running in the Node environment is implemented as follows:

```js
#!/usr/bin/env node

// Invoked on the commit-msg git hook.

const chalk = require("chalk")
const message = require("fs").readFileSync(process.env.GIT_PARAMS, "utf-8").trim()

const COMMIT_REG = /^(revert: )?(wip|feat|fix|docs|style|refactor|perf|test|workflow|build|ci|chore|merge|release)(\(.+\))?: .{1,50}/

if (!COMMIT_REG.test(message)) {
  console.log()
  console.error(
    `  ${chalk.bgRed.white(" ERROR ")} ${chalk.red(`invalid commit message format.`)}\n\n` +
      chalk.red(`  Proper commit message format is required for automated changelog generation. Examples:\n\n`) +
      `    ${chalk.green(`feat(compiler): add 'graphiteWidth' option`)}\n` +
      `    ${chalk.green(`fix(graphite): stop graphite breaking when width < 0.1 (close #28)`)}\n\n` +
      chalk.red(`  See .github/commit-convention.md for more details.\n`),
  )
  process.exit(1)
}
```

## Examples

Appears under "Features" header, `pencil` subheader:

```
feat(pencil): add 'graphiteWidth' option
```

Appears under "Bug Fixes" header, `graphite` subheader, with a link to issue #28:

```
fix(graphite): stop graphite breaking when width < 0.1

close #28
```

Appears under "Performance Improvements" header, and under "Breaking Changes" with the breaking change explanation:

```
perf(core):  remove graphiteWidth option

BREAKING CHANGE: The graphiteWidth option has been removed.
```

The following commit and commit `667ecc1` do not appear in the changelog if they are under the same release. If not, the revert commit appears under the "Reverts" header.

```
revert: feat(pencil): add 'graphiteWidth' option

This reverts commit 667ecc1654a317a13331b17617d973392f415f02.
```

## Commit Message Format

A commit message consists of a **header**, **body** and **footer**. The header has a **type**, **scope** and **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The `header` is mandatory and must conform to the [Commit Message Header](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit-header) format.

The `body` is mandatory for all commits except for those of scope "docs". When the body is required it must be at least 20 characters long.

The `footer` is optional.

Any line of the commit message cannot be longer than 100 characters.

### Commit Message Header

```
<type>(<scope>): <subject>
  │       │             │
  │       │             └─⫸ Summary in present tense. Not capitalized. No period at the end.
  │       │
  │       └─⫸ Commit Scope: A specifier for the commit change such as `core`, `compiler`, etc.
  │
  └─⫸ Commit Type: work|feat|fix|docs|style|refactor|perf|test|build|ci|chore
```

The `<type>` and `<summary>` fields are mandatory, the `(<scope>)` field is optional.

#### Type

If the prefix is `feat`, `fix` or `perf`, it will appear in the changelog. However, if there is any [BREAKING CHANGE](#footer), the commit will always appear in the changelog.

Other prefixes are up to your discretion. Suggested prefixes are `build`, `ci`, `docs` ,`style`, `refactor`, and `test` for non-changelog related tasks.

More detailed explanation about these types are the following:

- Wip: Work in progress
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Code style, changes that do not affect the meaning of the code (such as white-space, formatting, missing semi-colons, etc.)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Add missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies (such as glup, webpack, rollup configuration, etc.)
- **ci**: Changes to CI(Continuous Integration) configuration files and scripts (such as Travis, Jenkins, GitLab CI, Circle, etc.)
- **chore**: Changes that don\'t modify src or test files(such as updating build tasks, package manager, etc)
- **revert**: Revert to a commit
- **merge**: Merge a branch

#### Scope

The scope could be anything specifying the place of the commit change. For example `core`, `compiler`, `ssr`, `transition` etc.

#### Subject

The subject contains a succinct description of the change:

- use the imperative, present tense: "change" not "changed" nor "changes"
- don't capitalize the first letter
- no dot (.) at the end

### Commit Message Body

Just as in the **subject**, use the imperative, present tense: "change" not "changed" nor "changes".
The body should include the motivation for the change and contrast this with previous behavior.

### Commit Message Footer

The footer should contain any information about **Breaking Changes** and is also the place to
reference GitHub issues that this commit **Closes**.

**Breaking Changes** should start with the word `BREAKING CHANGE:` with a space or two newlines. The rest of the commit message is then used for this.

## Revert commits

If the commit reverts a previous commit, it should begin with `revert: `, followed by the header of the reverted commit.

The content of the commit message body should contain:

- information about the SHA of the commit being reverted in the following format: `This reverts commit <SHA>`,
- a clear description of the reason for reverting the commit message.
