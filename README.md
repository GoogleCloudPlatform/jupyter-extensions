# Google Cloud Platform AutoML Extension

`jupyterlab_automl` - Provides a JupyterLab interface for using Google's structured data [Cloud AutoML](https://cloud.google.com/automl) services.

End-user documentation can be found at https://cloud.google.com/automl-tables/docs/beginners-guide.

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

### enabled APIs

The extension utilizes the [Cloud AutoML API](https://cloud.google.com/automl). Make sure this API is enabled on your project in the GCP console.
