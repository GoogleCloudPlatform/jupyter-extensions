# Notebook AutoML Extension

JupyterLab extension project

## Prerequisites

* Python 3.5+
* [JupyterLab](https://jupyterlab.readthedocs.io/en/stable/getting_started/installation.html)
* [Virtualenv](https://virtualenv.pypa.io/en/latest/) (Recommended for local development)
* [NPM](https://nodejs.org/en/) (For local development)

## GCP Installation

This should work on Google Cloud Deep Learning VM M19+.

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

# Copy the dist/jupyterlab_automl-x.x.x.tar.gz archive to the JupyterLab
# server

# Install the Python package
server$ sudo pip3 install jupyterlab_automl-x.x.x.tar.gz
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
pip install jupyterlab==1.2.6
pip install .

# Install the npm package and the extension
npm install
jupyter labextension install .

# Now, run npm start which starts the Typescript compiler in watch mode on the
# extension directory as well as the JupyterLab server
npm start
```
