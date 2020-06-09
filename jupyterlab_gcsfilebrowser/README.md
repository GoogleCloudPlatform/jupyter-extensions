# GCS Notebooks Filebrowser Extension

`jupyterlab_gcsfilebrowser` - Provides a mechanism browse and interact with
Google Cloud Storage through a file browser.

![Demo](https://storage.googleapis.com/deeplearning-platform-ui-public/jupyterlab_gcsfilebrowser_demo.gif)

## Prerequisites

* Python 3.5+
* [JupyterLab](https://jupyterlab.readthedocs.io/en/stable/getting_started/installation.html)
* [Virtualenv](https://virtualenv.pypa.io/en/latest/) (Recommended for local development)

## Installation

This should work on Google Cloud Deep Learning VM M19+.

### Credentials

This extension requires credentials to exist on the JupyterLab server.

If credentials do not exist on the server, follow the Google Cloud [Getting Started with Authentication](https://cloud.google.com/docs/authentication/getting-started) instructions.

### Install on Google Cloud Deep Learning VM from public release

Use the [deploy-latest.sh](./deploy-latest.sh) script to upload and install from the latest publicly released [tarball](https://storage.googleapis.com/deeplearning-platform-ui-public/jupyterlab_gcsfilebrowser-latest.tar.gz) on a DLVM over SSH using the instance name.  Requires gcloud from the Google Cloud SDK to be [installed](https://cloud.google.com/sdk/install).

```bash
./deploy-latest.sh ${INSTANCE_NAME?}
```

### Install Google Cloud Deep Learning VM from local

Use the [deploy.sh](./deploy.sh) script to build the extension locally, upload, and
install on a DLVM over SSH using the instance name. Requires gcloud from the Google Cloud SDK to be [installed](https://cloud.google.com/sdk/install).

```bash
./deploy.sh ${INSTANCE_NAME?}
```
### Manually install from local

```bash
# Build the Python source distribution package
local$ python setup.py sdist

# Copy the dist/jupyterlab_gcsfilebrowser-x.x.x.tar.gz archive to the JupyterLab
# server

# Install the Python package
server$ sudo pip3 install jupyterlab_gcsfilebrowser-x.x.x.tar.gz
# Force Jupyter to rebuild the front-end packages
server$ sudo jupyter lab build
server$ sudo service jupyter restart
```

## Development

For a development install (requires npm version 4 or later), do the following in the repository directory:

You will need to have Python3, virtualenv, and npm installed.

```bash
# Create a Python 3 virtualenv and install jupyterlab and the project in edit mode
virtualenv -p python3 venv
source venv/bin/activate
# Install the version of jupyterlab used by DLVM images
pip install jupyterlab
pip install .

# Install the npm package and the extension
npm install
jupyter labextension install . --no-build

# Now, run npm start which starts the Typescript compiler in watch mode on the
# extension directory as well as the JupyterLab server
npm start
```

## Releasing

See: go/jupyterlab-gcsfilebrowser-release-notes
