# Notebook Comments in Git Extension

This extension provides support for document comments for Notebooks and other files stored in Git repositories.

## Prerequisites

1. Install and setup [git-appraise](https://github.com/google/git-appraise#installation)

2. Ensure that the git command line tool is configured with the credentials it needs to push to and pull from the remote repo.

## Install/Development

Follow the [instructions](https://github.com/GoogleCloudPlatform/jupyter-extensions#development) from the root of the repository. It is also recommended to run ``jupyter lab build`` after installing the extension.

### Configuration

The following attributes can be configured by modifying the [Jupyter config file](https://github.com/GoogleCloudPlatform/jupyter-extensions/blob/master/jupyterlab_comments/jupyter-config/jupyter_notebook_config.d/jupyterlab_comments.json)

1) The name of the remote repository to connect. The default name is 'origin'.

2) A constant interval at which to pull new comments from the remote repository. The default is every 10 seconds.

If you change these attributes, you will need to run ``npm run install-extension`` again.

After installation, the extension can be activated by navigating to the JupyterLab command palette and selecting 'Notebook comments in git'

# Mirroring comments from pull requests in GitHub (optional)

This GitHub [workflow](https://github.com/google/git-appraise/blob/master/.github/workflows/mirror-pull-requests.yaml) can be used to automatically mirror pull request data into git-notes so that PR comments can also be viewed in the extension.

