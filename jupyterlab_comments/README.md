# Notebook Comments in Git Extension

This extension provides support for document comments for Notebooks and other files stored in Git repositories.

## Prerequisites

Install [git-appraise](https://github.com/google/git-appraise#installation)

## Development

1. Follow the [instructions](https://github.com/GoogleCloudPlatform/jupyter-extensions#development) from the root of the repository.

### Configuration

The following attributes can be configured by modifying the [Jupyter config file](https://github.com/GoogleCloudPlatform/jupyter-extensions/blob/master/jupyterlab_comments/jupyter-config/jupyter_notebook_config.d/jupyterlab_comments.json)

1) The name of the remote repository to connect. The default name is 'origin'.

2) A constant interval at which to pull new comments from the remote repository. The default is every 10 seconds.

If you change these attributes, you will need to run 'npm run install-extension' again.


