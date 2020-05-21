# GCP Notebooks Scheduler Extension

`jupyterlab_gcpscheduler` - Provides a mechanism to run Notebooks on Google
Cloud Platform infrastructure, either immediately or on a recurring schedule.

End-user documentation can be found at https://drive.google.com/file/d/1djM8fXBERSKkQ-avxM6Lv-kbfkjNucN_/view

## Prerequisites

- Python 3.5+
- [JupyterLab](https://jupyterlab.readthedocs.io/en/stable/getting_started/installation.html)
- [Virtualenv](https://virtualenv.pypa.io/en/latest/)
  - Recommended for local development

## Installation

This should work on Google Cloud Deep Learning VM M19+. You may also use the
[deploy.sh](./deploy.sh) script to build the extension locally, then copy and
install on a DLVM over SSH.

```bash
# Build the Python source distribution package
python setup.py sdist

# Copy the dist/jupyterlab_gcpscheduler-x.x.x.tar.gz archive to the JupyterLab
# server and untar it

# Install the Python package
sudo pip3 install .
# Force Jupyter to rebuild the front-end packages
sudo jupyter lab build
sudo service jupyter restart
```

## Development

For a development install (requires npm version 4 or later), do the following in the repository directory:

You will need to have Python3, virtualenv, and npm installed.

```bash
# Create a Python 3 virtualenv and install the project
virtualenv -p python3 venv
source venv/bin/activate
pip install .

# Install the npm package and the extension
npm install
jupyter labextension install . --no-build

# Now, run npm start which starts the Typescript compiler in watch mode on the
# extension directory as well as the JupyterLab server
npm start
```

### gcloud authorization

The extension uses the machine's
[Application Default Credentials](https://cloud.google.com/docs/authentication/production).
Locally, you can set this using the gcloud command. First, set the gcloud tool's
`project` configuration to the project you wish to use for development.

`gcloud config set project <project-id>`

Then, issue the `gcloud auth application-default login` command to store the
credential. You may need to repeat this procedure daily on a Google-owned
machine.

## Releasing

The following steps are to be followed when releasing a new version of the
extension.

1. Update version references in [package.json](package.json) and
   [jupyterlab_gcpscheduler/version.py](./jupyterlab_gcpscheduler/version.py).
2. Ensure all changes are submitted for review and committed to the remote repository.
3. Create a new tag number for the version.
   - `git tag vx.x.x -m "vx.x.x release"` where x.x.x is the version number.
4. Push the tag to the remote repository.
   - `git push origin vx.x.x` where x.x.x is the version number.
5. Submit the Cloud Build process to build the extension, package it as a tarball,
   and make it publicly available for installation from GCS.
   - ```
      gcloud --project deeplearning-platform-ui builds submit \
        --config cloudbuild-release.yaml
     ```
6. Verify that `jupyterlab_gcpscheduler-x.x.x.tar.gz` and `jupyterlab_gcpscheduler-latest.tar.gz`
   are updated in the [gs://deeplearning-platform-ui-public](https://console.cloud.google.com/storage/browser/deeplearning-platform-ui-public?project=deeplearning-platform-ui) GCS bucket.
