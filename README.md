# Google Cloud Platform Extensions for Jupyter and JupyterLab

This repository serves as a common repository for Google-developed extensions
for the Jupyter and JupyterLab environments.

## Development

The following steps only need to be completed once to setup your initial
development environment.

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

1. Run `npm run link` to link the [gcp-jupyterlab-shared](./shared/client)
   package into the JupyterLab environment.

   - This allows local development on the common frontend components library
     to be used in other extensions without needing to publish and re-install
     updated versions of the packages.

1. `cd` into the folder of the extension you plan to develop and run
   `npm run install-extension`. This installs the extension in the
   JupyterLab environment in development mode. Afterwards, `cd` back to the root
   of the repository.

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