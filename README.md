# Google Cloud Platform Extensions for Jupyter and JupyterLab

This repository serves as a common repository for Google-developed extensions
for the Jupyter and JupyterLab environments.

## Development

The following steps only need to be completed once to setup your initial
development environment.

**Note**: If at any point you want to go through these steps on a fresh
JupyterLab environment, you can run `pipenv --rm` to remove the virtual
environment.

1. Clone this repository.

   - `git clone git@github.com:GoogleCloudPlatform/jupyter-extensions.git`

1. `cd` into the repository directory and install the NPM dependencies
   with `npm install`.

1. Run `npm run bootstrap` to install the dependencies for each of the extension
   subfolders.

   - You should repeat this command anytime you add a new NPM dependency to one
     of the subfolder packages.

1. Run `pipenv install`.

   - Install [pipenv](https://github.com/pypa/pipenv#installation) if you don't
     have it already to assist with managing a clean Python environment.

1. Run `pipenv shell` to activate the virtual Python environment with the
   necessary dependencies installed.

1. Run `cd shared/` and then `npm run install-shared` to install the shared
   package.

1. Run `npm run link` to link the [gcp-jupyterlab-shared](./shared/client)
   package into the JupyterLab environment.

   - This allows local development on the common frontend components library
     to be used in other extensions without needing to publish and re-install
     updated versions of the packages.
   - If you are having trouble running this command, try restarting these
     steps on a new JupyterLab environment (see Note above).

1. `cd` into the folder of the extension you plan to develop and run
   `npm run install-extension`. This installs the extension in the
   JupyterLab environment in development mode. Afterwards, `cd` back to the root
   of the repository.

   - Run `jupyter labextension install @jupyter-widgets/jupyterlab-manager@1.1` if your extension requires ipywidget. Currently, this is a requirement for the jupyterlab_bigquery extension.

1. Run `npm run watch` to start the TypeScript compiler in watch mode. This will
   watch for changes in any of the TypeScript sources.

   - Alternatively, you can run the `npm run watch` command only in the packages
     you are working in.

1. In a seperate terminal, run `pipenv shell` and then `npm run devserver`.
   This will start JupyterLab in watch mode to pick up any changes to either the
   TypeScript or Python code.

   - You can watch the terminal output to ensure that the TS compiler has
     successfully recompiled your package. Then, you can refresh the browser
     tab to see your change.
   - If your change isn't present after a refresh cycle, you may need to stop
     and restart the `watch` or `devserver` tasks. This may occur when adding
     a new file to the project.

You can then open JupyterLab at one of the links shown in the logging output.

## Testing on an AI Platform Notebook

If you would like to test an extension in an AI Platform Notebook, you can do so
by following these steps.

1. Create a new AI Platform Notebook from the Cloud Console.

1. `cd` into the directory of the extension you wish to install.

1. Run `../scripts/deploy.sh` passing the instance's name and zone as arguments.

   - ie. `../scripts/deploy.sh test-instance us-east1-b`
