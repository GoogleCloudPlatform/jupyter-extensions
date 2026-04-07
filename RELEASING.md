# Releasing to PyPI

This repository uses a GitHub Actions workflow to automatically publish packages to PyPI when a version tag is pushed.

## Supported packages

- `google-cloud-jupyter-config`
- `kernels-mixer`
- `jupyter-gcs-contents-manager`

## How to release

1. Update the version in the package's `setup.py`.
2. Commit and push the change.
3. Create and push a tag using the format `<package-name>-v<version>`:

   ```bash
   git tag google-cloud-jupyter-config-v0.0.13
   git push origin google-cloud-jupyter-config-v0.0.13
   ```

   More examples:

   ```bash
   git tag kernels-mixer-v0.0.16
   git tag jupyter-gcs-contents-manager-v0.0.2
   ```

The workflow will automatically build and publish the corresponding package to PyPI.

## Prerequisites

This workflow uses [PyPI trusted publishing](https://docs.pypi.org/trusted-publishers/) (OIDC) so no API tokens need to be stored in GitHub secrets. Each package must be registered as a trusted publisher on PyPI.

To set this up for a package:

1. Go to the package's settings on [pypi.org](https://pypi.org).
2. Navigate to **Publishing** > **Add a new publisher**.
3. Fill in the following values:
   - **Owner:** `GoogleCloudPlatform` (or your fork's owner)
   - **Repository:** `jupyter-extensions`
   - **Workflow name:** `publish.yml`
   - **Environment:** (leave blank)

Repeat this for each package you want to publish.
