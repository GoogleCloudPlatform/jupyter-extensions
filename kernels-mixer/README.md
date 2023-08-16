# Jupyter Kernel Mixing

This package provides a Jupyter Server extension that allows you to run local and remote
kernels side by side.

It does this by "mixing" the local and remote kernels together into a single collection
containing both.

This collection then keeps track of whether specific kernels were local or remote and
forwards any corresponding kernel requests accordingly.

## Installation

Install the `kernels-mixer` Python package using `pip`:

```sh
pip install kernels-mixer
```

## Setup

If you do not already have a Jupyter config file (e.g. `~/.jupyter/jupyter_lab_config.py`),
the first generate one with the following command:

```sh
jupyter lab --generate-config
```

The open your config file and add the following two lines to the end:

```py
import kernels_mixer
kernels_mixer.configure_kernels_mixer(c)
```

## Kernel Name Uniqueness

This extension expects that local and remote kernels have different names. If that is not
the case then the local kernel will override the remote kernel. For example, if there is
a local kernel named "python3", then any kernels in the remote kernel gateway named "python3"
will be hidden in favor of it.

When using this extension, it is recommended that the remote kernel gateway is set up to
add a prefix onto every kernel name in order to distinguish them from the local kernels.

Similarly, it is recommended that remote kernel display names are augmented to indicate
where they are running.

The default kernel gateway used with this extension is the regional GCP kernel gateway
hosted under `kernels.googleusercontent.com`, which ensures that both of those conditions
are followed.
