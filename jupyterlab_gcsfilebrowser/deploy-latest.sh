INSTANCE_NAME=${1?}

gcloud compute ssh "jupyter@${INSTANCE_NAME?}" -- \
       "sudo su -p -l root -c \"/opt/conda/bin/pip install https://storage.googleapis.com/deeplearning-platform-ui-public/jupyterlab_gcsfilebrowser-latest.tar.gz\" && \
        sudo su -p -l root -c '/opt/conda/bin/jupyter lab build' && \
        sudo service jupyter restart"

