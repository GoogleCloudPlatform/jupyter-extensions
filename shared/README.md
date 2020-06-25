# Common frontend components, server extension, and packages for GCP JupyterLab extensions

Common package for shared frontend components and Python server modules 
to be used across JupyterLab extensions.

## Features

This module exposes two routes:

1. `/gcp/v1/metadata` - A subset of the [GCE VM Metadata](https://cloud.google.com/compute/docs/storing-retrieving-metadata)
   with AI Platform Notebook-specific keys pulled to the top-level to identify
   the ML framework installed on the machine.
1. `/gcp/v1/proxy` - A proxy-endpoint that accepts a base64-encoded Google API
   endpoint as a path and forwards the request to the decoded API service method.
   This is provided so that frontend code can issue API requests to the
   JupyterLab server, which will attach its machine credential to the request
   before forwarding it to the API service. This avoids the problem of requring
   end-user authentication at the UI, or passing the machine credential to the
   browser which is not supported.

## Development

Follow the [instructions](../#Development) from the root of the repository.

Install this package in editable mode by `cd`-ing into this directory
and running the `../dev-install.sh` script.

When developing locally, in order to access a metadata server running on GCE VM,
you will need to issue the following command to set up port forwarding.
This will allow requests made locally to port 8889 to be forwarded to a real GCE
metadata server. Do this in another terminal window since it will create an
interactive SSH session.

`gcloud compute ssh ${INSTANCE} --ssh-flag "-L 8889:metadata.google.internal:80"`

Set the METADATA_SERVER environment variable to tell the server to use
the forwarded address

`export METADATA_SERVER="http://localhost:8889"`
