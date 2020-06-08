#!/bin/bash

pip install -e .
cp -v jupyter-config/jupyter_notebook_config.d/jupyterlab_gcedetails.json \
  `pipenv --venv`/etc/jupyter/jupyter_notebook_config.d/
jupyter labextension install . --no-build
