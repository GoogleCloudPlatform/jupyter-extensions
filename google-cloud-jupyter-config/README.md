# Notebook server configuration using the Google Cloud SDK

This package provides Python classes that can be used in the Jupyter config file
(e.g. `~/.jupyter/jupyter_lab_config.py`) in order to fill in some configuration
using the Google Cloud SDK's [`gcloud` tool](https://cloud.google.com/sdk/gcloud).

## Included features

This package provides utility methods to look up any configuration options stored
in the active gcloud config, in particular the project and region.

Additionally, this provides a utility method to update a given
[`Config`](https://traitlets.readthedocs.io/en/latest/config-api.html#traitlets.config.Config)
object to connect to a kernel gateway URL managed by Google.

## Prerequisites

Install both Jupyter and [gcloud](https://cloud.google.com/sdk/docs/install).

For the kernel gateway feature, you will need an installation of Jupyter that uses the
`jupyter_server` project and the version of `jupyter_server` you have installed needs to be
at least version `2.4.0`.

You will also need to log in to gcloud:

```sh
gcloud auth login
```

... and configure your project and region:

```sh
gcloud config set core/project ${PROJECT}
gcloud config set compute/region ${REGION}
```

## Install

Clone this repository, and from this directory run the following:

```sh
pip install .
```

## Setup

If you do not already have a Jupyter config file (e.g. `~/.jupyter/jupyter_lab_config.py`),
the first generate one with the following command:

```sh
jupyter lab --generate-config
```

The open your config file and add the following two lines to the end:

```py
import google.cloud.jupyter_config
google.cloud.jupyter_config.configure_gateway_client(c)
```
