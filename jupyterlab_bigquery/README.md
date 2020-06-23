# JupyterLab BigQuery Extension

`jupyterlab_bigquery` - Provides a mechanism to browse, view, interact with, and query BigQuery data from Notebooks.

## Development

1. Follow the [instructions](../#Development) from the root of the repository.

### gcloud authorization

The extension uses the machine's
[Application Default Credentials](https://cloud.google.com/docs/authentication/production).
Locally, you can set this using the gcloud command. First, set the gcloud tool's
`project` configuration to the project you wish to use for development.

`gcloud config set project <project-id>`

Then, issue the `gcloud auth application-default login` command to store the
credential. You may need to repeat this procedure daily on a Google-owned
machine.
