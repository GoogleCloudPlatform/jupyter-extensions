import setuptools

with open("README.md", "r") as fh:
    long_description = fh.read()

setuptools.setup(
    name="jupyter-gcs-contents-manager",
    version="0.0.1",
    description="GCS Contents Manager for Jupyter",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/GoogleCloudPlatform/jupyter-gcs-contents-manager",
    py_modules=["gcs_contents_manager"],
    license="Apache License 2.0",
    python_requires='>=2.7',
    install_requires=['google-cloud-storage', 'nbformat', 'notebook', 'traitlets', 'tornado',],
)
