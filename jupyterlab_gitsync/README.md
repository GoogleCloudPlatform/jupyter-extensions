# JupyterLab Git Sync Extension

The JupyterLab Git Sync extension provides a real-time editing feature on JupyterLab for git repositories. 

## Development

1. Clone the project repository. 

	```
	git clone git@github.com:GoogleCloudPlatform/jupyter-extensions.git
	```

2. From the repository root, `cd` into `jupyterlab_gitsync/jupyterlab_gitsync/git-sync-changes` and initialize the submodule. 

	```
	cd jupyterlab_gitsync/jupyterlab_gitsync/git-sync-changes
	git submodule update --init .
	```
	- The extension is dependent on a script located in the git-sync-changes repository. If the submodule is not initialized, the sync operation will fail. 

3. OPTIONAL: Set up a test directory for testing syncs without modifying the project repository contents. In the directory that you want to clone your submodule in, run the following command. 
    ```
    git submodule add [git-clone-ssh or git-clone-http]
    ```
    - For more information, read about Git Submodules. 
    
3. Follow the [instructions](../README.md) from the root of the repository to set up the development environment.
