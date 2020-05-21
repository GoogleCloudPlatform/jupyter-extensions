# GCP Notebooks Details extension

`jupyterlab_gcedetails` - Provides a simple status-bar widget that conveys
information about the GCE VM that JupyterLab is running on.

![Demo](https://storage.googleapis.com/deeplearning-platform-ui-public/jupyterlab_gcedetails_demo.gif)

## Prerequisites

- Python 3.5+
- [JupyterLab](https://jupyterlab.readthedocs.io/en/stable/getting_started/installation.html)
- [Virtualenv](https://virtualenv.pypa.io/en/latest/)
  - Recommended for local development

## Installation

This should work on Google Cloud Deep Learning VM M19+. You may also use the
[deploy.sh](./deploy.sh) script to build the extension locally, then copy and
install on a DLVM over SSH.

## Development

For a development install (requires npm version 4 or later), do the following in the repository directory:

You will need to have Python3, virtualenv, and npm installed.

```bash
# Create a Python 3 virtualenv and install jupyterlab and the project in edit mode
virtualenv -p python3 venv
source venv/bin/activate
pip install .

# Install the npm package and the extension
npm install
jupyter labextension install . --no-build

# In order to access the metadata server running on GCE VM, you will need to
# issue the following command to set up port forwarding. This will allow
# requests made locally to port 8889 to be forwarded to a real GCE metadata
# server. Do this in another terminal window since it will create an interactive
# SSH session
gcloud compute ssh jupyter@${INSTANCE} --ssh-flag "-L 8889:metadata.google.internal:80"

# set the METADATA_SERVER environment variable to tell the server to use
# the forwarded address
export METADATA_SERVER="http://localhost:8889"

# Now, run npm start which starts the Typescript compiler in watch mode on the
# extension directory as well as the JupyterLab server
npm start
```

### End-to-end tests

To run end-to-end tests, perform the following steps.

1. Install this extension on an AI Platform Notebook instance.
2. Open an SSH port-forward to the instance.
   ```
   gcloud --project $PROJECT compute ssh $INSTANCE \
      --zone $ZONE -- -N -L 8080:localhost:8080
   ```
   where `$PROJECT`, `$INSTANCE`, and `$ZONE` are set beforehand.
3. In another terminal, set the `PROJECT` and `INSTANCE` environment variables,
   and then run the `npm run e2e-test` command.

   ```
   export PROJECT=<project>
   export INSTANCE=<instance>
   npm run e2e-test
   ```

## Releasing

The following steps are to be followed when releasing a new version of the
extension.

1. Update version references in [package.json](package.json) and
   [jupyterlab_gcedetails/version.py](./jupyterlab_gcedetails/version.py).
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
6. Verify that `jupyterlab_gcedetails-x.x.x.tar.gz` and `jupyterlab_gcedetails-latest.tar.gz`
   are updated in the [gs://deeplearning-platform-ui-public](https://console.cloud.google.com/storage/browser/deeplearning-platform-ui-public?project=deeplearning-platform-ui) GCS bucket.
