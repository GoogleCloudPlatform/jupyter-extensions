# jupyterlab_comments

Notebooks comments in git



## Requirements

* JupyterLab >= 2.0

## Install

```bash
jupyter labextension install jupyterlab-comments
```
### Install

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Move to jupyterlab_comments directory

# Install dependencies
jlpm
# Build Typescript source
jlpm build
# Link your development version of the extension with JupyterLab
jupyter labextension link .
# Rebuild Typescript source after making changes
jlpm build
# Rebuild JupyterLab after making any changes
jupyter lab build
```

You can watch the source directory and run JupyterLab in watch mode to watch for changes in the extension's source and automatically rebuild the extension and application.

```bash
# Watch the source directory in another terminal tab
jlpm watch
# Run jupyterlab in watch mode in one terminal tab
jupyter lab --watch
```

### Uninstall

```bash

jupyter labextension uninstall jupyterlab-comments
```

### Usage
Add the following lines to your Jupyter config file (e.g. jupyter_notebook_config.py):
```bash
c.Git.remote = '${NAME_OF_REMOTE_REPOSITORY}'

c.Refresh.interval = '${REFRESH_INTERVAL_SECONDS}'
```
1) The name of the remote repository defaults to 'origin' if no value is configured.

2) New comments are pulled from the current repository at a constant interval which can be configured. The default interval is 10 seconds.


