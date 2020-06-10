# Google Cloud Platform Extensions for Jupyter and JupyterLab

This repository serves as a common repository for Google-developed extensions
for the Jupyter and JupyterLab environments.

## Development

The following steps only need to be completed once to setup your initial
development environment.

1. Run `npm run bootstrap` to install all NPM package dependencies.

   - This also links local package dependencies to one another.
   - You should repeat this command anytime you add a new NPM dependency to one
     of the subfolder packages.

1. Run `pipenv install` in this folder.

   - Install [pipenv](https://github.com/pypa/pipenv#installation) if you don't
     have it already to assist with managing a clean Python environment.

1. Run `pipenv shell` to activate the virtual Python environment with the
   necessary dependencies installed.

1. Run `npm run link` to link the [gcp-jupyterlab-shared](./shared/client)
   package into the JupyterLab environment. This allows local development on
   the common components without the need to check packages into NPM.

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

You can then open JupyterLab at one of the links shown in the logging output.
