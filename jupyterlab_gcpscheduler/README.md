# GCP Notebooks Scheduler Extension

`jupyterlab_gcpscheduler` - Provides a mechanism to run Notebooks on Google
Cloud Platform infrastructure, either immediately or on a recurring schedule.

End-user documentation can be found at https://drive.google.com/file/d/1djM8fXBERSKkQ-avxM6Lv-kbfkjNucN_/view

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
