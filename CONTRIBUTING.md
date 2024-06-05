# Contributing

This project welcomes contributions and suggestions.

# How to contribute to the azure-middy project?

There are many ways that you can contribute to the azure-middy project:

-   Submit a bug
-   Submit a code fix for a bug
-   Submit additions or modifications to the documentation
-   Submit a feature request

All code submissions will be reviewed and tested by the team, and those that meet a high bar for both quality and design/roadmap appropriateness will be merged into the source. Be sure to follow the existing file/folder structure when adding new plugins or packages.

If you encounter any bugs with the library please file an issue in the [Issues](https://github.com/kevboutin/azure-middy/issues) section of the project.

## Things to keep in mind when contributing

Some guidance for when you make a contribution:

-   Add/update unit tests and code as required by your change
-   Make sure you run prettier on the affected code.
-   Make sure you run all the unit tests on the affected code.
-   Deploy one of the examples and test to make sure the library works in a real scenario.

## Big contributions

If your contribution is significantly big, it is better to first check with the project developers in order to make sure the change aligns with the long term plans. This can be done simply by submitting a question via the GitHub Issues section.

## Project orchestration

This project uses [Lerna](https://lerna.js.org) to manage our many workspaces within a single repository as a monorepo. It is highly recommended that you familiarize yourself with the tool: [Getting Started](https://lerna.js.org/docs/getting-started).

## Setting up your environment

Want to get started hacking on the code? Great! Keep reading.

### Prerequisites

Make sure you have these prerequisites installed and available:

-   Git
-   The version of Node.js specified in [.nvmrc](https://github.com/kevboutin/azure-middy/blob/main/.nvmrc)
-   Azure Function Core Tools:

    -   Windows: Install the [Azure Function Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=windows%2Cisolated-process%2Cnode-v4%2Cpython-v2%2Chttp-trigger%2Ccontainer-apps&pivots=programming-language-javascript) from Microsoft.
    -   macOS: Install the [Azure Function Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=macos%2Cisolated-process%2Cnode-v4%2Cpython-v2%2Chttp-trigger%2Ccontainer-apps&pivots=programming-language-javascript).
    -   Linux: Install the [Azure Function Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=linux%2Cisolated-process%2Cnode-v4%2Cpython-v2%2Chttp-trigger%2Ccontainer-apps&pivots=programming-language-javascript).

### Building our repository

1. Fork this repo
2. Clone your fork locally (`git clone https://github.com/<youruser>/azure-middy.git`)
3. Open a terminal and move into your local copy (`cd azure-middy`)
4. Install the package dependencies (`npm install`)

### Testing

If you want to run the tests of a specific package, go to that package's folder and execute `npm run test`. Usually you will execute `npm run test` from the root directory of the project so all tests are run.

### Documentation

We care deeply about the quality of our documentation in order to make the experience of using our library as easy as possible. We use [JSDoc](https://jsdoc.app) tags to mainly document our functions, modules, classes, etc.

### Formatting changed files

We use husky as git hooks that formats your changed files on commit. Moreover, without the hook, you can manually format changed files by invoking `npm run lint`.

### Package Versioning

We follow [SemVer](https://semver.org/). When publishing an npm package, npm distribution tags are automatically set based on the version being published and current versions present on npm and there is no need to set tag manually when running a release pipeline.

Stable releases will follow SemVer and the published package will get the tag latest.
