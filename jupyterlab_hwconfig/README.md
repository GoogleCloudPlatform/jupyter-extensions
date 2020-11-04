# GCP Notebooks Hardware Configuration extension

`jupyterlab_hwconfig` - Provides a status-bar widget that conveys
configuration and utilization information about the GCE VM that JupyterLab is
running on and allows users to update the Notebook VM configuration.

![Demo](https://storage.googleapis.com/deeplearning-platform-ui-public/jupyterlab_hwconfig_demo.gif)

## Development

1. Follow the [instructions](../#Development) from the root of the repository.

In order to access the metadata server running on GCE VM, you will need to
issue the following command to set up port forwarding. This will allow
requests made locally to port 8889 to be forwarded to a real GCE metadata
server. Do this in another terminal window since it will create an interactive
SSH session. Replace the instance variable in the URL below with the name of an instance
that has the configurations you want. It can be found under the notebooks tab in GCP AI Platform.

```
gcloud compute ssh ${INSTANCE} --zone ${ZONE} \
  --ssh-flag "-L 8889:metadata.google.internal:80"
```

Set the METADATA_SERVER environment variable to tell the server to use
the forwarded address

`export METADATA_SERVER="http://localhost:8889"`

Now you can start the JupyterLab server from the repository root by running
`npm run devserver`.

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
