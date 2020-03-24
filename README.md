# GCS Contents Manager for Jupyter

This repository provides a [ContentsManager](https://jupyter-notebook.readthedocs.io/en/stable/extending/contents.html)
for Jupyter that stores notebook files in [Google Cloud Storage](https://cloud.google.com/storage).

## Prerequisites

You must have the GCS Python client library installed. You can
install it using the following command:

```sh
pip install google-cloud-storage
```

Additionally, you must have application default credentials
set up. Those can be created using the following command:

```sh
gcloud auth application-default login
```

## Installation

Download the `gcs_contents_manager.py` file from this repository,
and then copy it into a directory in your PYTHONPATH.

## Usage

Add the following lines to your Jupyter config file (e.g. jupyter_notebook_config.py):

    from gcs_contents_manager import GCSContentsManager
    c.NotebookApp.contents_manager_class = GCSContentsManager
    c.GCSContentsManager.bucket_name = '${NOTEBOOK_BUCKET}'
    c.GCSContentsManager.bucket_notebooks_path = '${NOTEBOOK_PATH}'
    c.GCSContentsManager.project = '${NOTEBOOK_PROJECT}'

For `${NOTEBOOK_BUCKET}` specify the name of the GCS bucket where
you want to store your notebooks, and for `${NOTEBOOK_PATH}`,
specify the name of the directory within that bucket that will be
treated as your root directory by Jupyter.

For `${NOTEBOOK_PROJECT}` specify the name of your GCP project
that you want to use for Jupyter. For most uses this will be the
same project that owns the GCS bucket.
