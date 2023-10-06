# Google Cloud Platform Extensions for Jupyter and JupyterLab

This repository serves as a common repository for Google-developed Jupyter extensions.

## Disclaimer

This is not an officially supported Google product.

## Contents

### Gcloud config helper for Jupyter extensions

The `google-cloud-jupyter-config` subdirectory contains the source code for the
[google-cloud-jupyter-config](https://pypi.org/project/google-cloud-jupyter-config/)
package.

This intended to be a reusable library that other extensions can use to get configuration
information from the [gcloud command line tool](https://cloud.google.com/cli)

### GCS Contents Manager

The `jupyter-gcs-contents-manager` subdirectory contains a Jupyter Contents Manager
that reads contents from a GCS bucket.

### Kernels Mixer

The `kernels-mixer` subdirectory contains the source code for the
[kernels-mixer](https://pypi.org/project/kernels-mixer/) package.

This is an extension for jupyter_server that allows local and remote kernels to be used
simultaneously.
