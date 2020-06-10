import { ISignal, Signal } from '@phosphor/signaling';
import { Contents, ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';

const DRIVE_NAME_GCS: 'GCS' = 'GCS';
const GCS_LINK_PREFIX = 'https://storage.cloud.google.com/';

/**
 * A Contents.IDrive implementation that Google Cloud Storage.
 */
export class GCSDrive implements Contents.IDrive {
  /**
   * Construct a new drive object.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  private _isDisposed = false;
  private _fileChanged = new Signal<this, Contents.IChangedArgs>(this);

  /**
   * The name of the drive.
   */
  get name() {
    return DRIVE_NAME_GCS;
  }

  /**
   * The server settings of the manager.
   */
  readonly serverSettings: ServerConnection.ISettings;

  /**
   * A signal emitted when a file operation takes place.
   */
  //fileChanged: ISignal<IDrive, IChangedArgs>;
  get fileChanged(): ISignal<this, Contents.IChangedArgs> {
    return this._fileChanged;
  }

  /**
   * Test whether the manager has been disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Dispose of the resources held by the manager.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    Signal.clearData(this);
  }

  /**
   * Get a file or directory.
   *
   * @param localPath: The path to the file.
   *
   * @param options: The options used to fetch the file.
   *
   * @returns A promise which resolves with the file content.
   */
  get(
    localPath: string,
    options?: Contents.IFetchOptions
  ): Promise<Contents.IModel> {
    return new Promise((resolve, reject) => {
      // TODO(cbwilkes): Move to a services library.
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'gcp/v1/gcs/files',
        localPath
      );
      ServerConnection.makeRequest(requestUrl, {}, serverSettings).then(
        response => {
          response.json().then(content => {
            if (content.error) {
              console.error(content.error);
              reject(content.error);
              return;
            }
            if (content.type === 'directory') {
              const directory_contents = content.content.map((c: any) => {
                return {
                  name: c.name,
                  path: c.path,
                  format: 'json',
                  type: c.type,
                  created: '',
                  writable: true,
                  last_modified: c.last_modified,
                  mimetype: c.mimetype,
                  content: c.content,
                };
              });
              const directory: Contents.IModel = {
                type: 'directory',
                path: localPath.trim(),
                name: localPath.trim(),
                format: 'json',
                content: directory_contents,
                created: '',
                writable: true,
                last_modified: content.last_modified,
                mimetype: '',
              };
              resolve(directory);
            } else if (content.type === 'file') {
              const decoded_content = Buffer.from(
                content.content.content.replace(/\n/g, ''),
                'base64'
              ).toString('utf8');

              resolve({
                type: 'file',
                path: content.content.path,
                name: content.content.path,
                format: 'text',
                content: decoded_content,
                created: '',
                writable: true,
                last_modified: content.content.last_modified,
                mimetype: content.content.mimetype,
              });
            }
          });
        }
      );
    });
  }

  /**
   * Get an encoded download url given a file path.
   *
   * @param A promise which resolves with the absolute POSIX
   *   file path on the server.
   */
  getDownloadUrl(localPath: string): Promise<string> {
    return Promise.resolve(GCS_LINK_PREFIX + localPath);
  }

  /**
   * Create a new untitled file or directory in the specified directory path.
   *
   * @param options: The options used to create the file.
   *
   * @returns A promise which resolves with the created file content when the
   *    file is created.
   */
  newUntitled(options?: Contents.ICreateOptions): Promise<Contents.IModel> {
    if (options.path === '/' || options.path === '') {
      return Promise.reject(
        'Cannot create new files in the root directory. ' +
          'Only GCS buckets can be created here.'
      );
    }
    return new Promise((resolve, reject) => {
      // TODO(cbwilkes): Move to a services library.
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(serverSettings.baseUrl, 'gcp/v1/gcs/new');
      const body = options;
      const requestInit: RequestInit = {
        body: JSON.stringify(body),
        method: 'POST',
      };
      ServerConnection.makeRequest(
        requestUrl,
        requestInit,
        serverSettings
      ).then(response => {
        response.json().then(content => {
          if (content.error) {
            console.error(content.error);
            reject(content.error);
            return;
          }
          if (content.type === 'directory') {
            const directory_contents = content.content.map((c: any) => {
              return {
                name: c.name,
                path: c.path,
                format: 'json',
                type: c.type,
                created: '',
                writable: true,
                last_modified: '',
                mimetype: c.mimetype,
                content: c.content,
              };
            });
            const directory: Contents.IModel = {
              type: 'directory',
              path: content.path,
              name: content.name,
              format: 'json',
              content: directory_contents,
              created: '',
              writable: true,
              last_modified: '',
              mimetype: '',
            };
            resolve(directory);
          } else if (content.type === 'file') {
            const decoded_content = Buffer.from(
              content.content.content.replace(/\n/g, ''),
              'base64'
            ).toString('utf8');

            resolve({
              type: 'file',
              path: content.content.path,
              name: content.content.name,
              format: 'text',
              content: decoded_content,
              created: '',
              writable: true,
              last_modified: '',
              mimetype: content.content.mimetype,
            });
          }
        });
      });
    });
  }

  /**
   * Delete a file.
   *
   * @param localPath - The path to the file.
   *
   * @returns A promise which resolves when the file is deleted.
   */
  delete(localPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // TODO(cbwilkes): Move to a services library.
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'gcp/v1/gcs/delete',
        localPath
      );
      const requestInit: RequestInit = {
        method: 'DELETE',
      };
      ServerConnection.makeRequest(
        requestUrl,
        requestInit,
        serverSettings
      ).then(response => {
        response.json().then(content => {
          if (content.error) {
            console.error(content.error);
            reject(content.error);
            return;
          }
          resolve(void 0);
        });
      });
    });
  }

  /**
   * Rename a file or directory.
   *
   * @param oldLocalPath - The original file path.
   *
   * @param newLocalPath - The new file path.
   *
   * @returns A promise which resolves with the new file content model when the
   *   file is renamed.
   */
  rename(oldLocalPath: string, newLocalPath: string): Promise<Contents.IModel> {
    return new Promise((resolve, reject) => {
      // TODO(cbwilkes): Move to a services library.
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(serverSettings.baseUrl, 'gcp/v1/gcs/move');
      const body = {
        oldLocalPath: oldLocalPath,
        newLocalPath: newLocalPath,
      };
      const requestInit: RequestInit = {
        body: JSON.stringify(body),
        method: 'POST',
      };
      ServerConnection.makeRequest(
        requestUrl,
        requestInit,
        serverSettings
      ).then(response => {
        response.json().then(content => {
          if (content.error) {
            console.error(content.error);
            reject(content.error);
            return;
          }
          let data: Contents.IModel;
          if (content.type === 'directory') {
            const directory_contents = content.content.map((c: any) => {
              return {
                name: c.name,
                path: c.path,
                format: 'json',
                type: c.type,
                created: '',
                writable: true,
                last_modified: '',
                mimetype: c.mimetype,
                content: c.content,
              };
            });
            data = {
              type: 'directory',
              path: content.path,
              name: content.name,
              format: 'json',
              content: directory_contents,
              created: '',
              writable: true,
              last_modified: '',
              mimetype: '',
            };
          } else if (content.type === 'file') {
            const decoded_content = Buffer.from(
              content.content.content.replace(/\n/g, ''),
              'base64'
            ).toString('utf8');

            data = {
              type: 'file',
              path: content.content.path,
              name: content.content.name,
              format: 'text',
              content: decoded_content,
              created: '',
              writable: true,
              last_modified: '',
              mimetype: content.content.mimetype,
            };
          }
          resolve(data);
          this._fileChanged.emit({
            type: 'rename',
            oldValue: { path: oldLocalPath },
            newValue: data,
          });
        });
      });
    });
  }

  /**
   * Save a file.
   *
   * @param localPath - The desired file path.
   *
   * @param options - Optional overrides to the model.
   *
   * @returns A promise which resolves with the file content model when the
   *   file is saved.
   */
  save(
    localPath: string,
    options?: Partial<Contents.IModel>
  ): Promise<Contents.IModel> {
    return new Promise((resolve, reject) => {
      // TODO(cbwilkes): Move to a services library.
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'gcp/v1/gcs/upload',
        localPath
      );
      const requestInit: RequestInit = {
        body: JSON.stringify(options),
        method: 'POST',
      };
      ServerConnection.makeRequest(
        requestUrl,
        requestInit,
        serverSettings
      ).then(response => {
        response.json().then(content => {
          if (content.error) {
            console.error(content.error);
            reject(content.error);
            return;
          }
          const data = {
            type: options.type,
            path: options.path,
            name: '',
            format: options.format,
            content: options.content,
            created: options.created,
            writable: true,
            last_modified: options.last_modified,
            mimetype: options.mimetype,
          };
          this._fileChanged.emit({
            type: 'save',
            newValue: null,
            oldValue: data,
          });
          resolve(data);
        });
      });
    });
  }

  /**
   * Copy a file into a given directory.
   *
   * @param localPath - The original file path.
   *
   * @param toLocalDir - The destination directory path.
   *
   * @returns A promise which resolves with the new content model when the
   *  file is copied.
   */
  copy(localPath: string, toLocalDir: string): Promise<Contents.IModel> {
    return new Promise((resolve, reject) => {
      // TODO(cbwilkes): Move to a services library.
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(serverSettings.baseUrl, 'gcp/v1/gcs/copy');
      const body = {
        localPath: localPath,
        toLocalDir: toLocalDir,
      };
      const requestInit: RequestInit = {
        body: JSON.stringify(body),
        method: 'POST',
      };
      ServerConnection.makeRequest(
        requestUrl,
        requestInit,
        serverSettings
      ).then(response => {
        response.json().then(content => {
          if (content.error) {
            console.error(content.error);
            reject(content.error);
            return;
          }
          resolve({
            type: 'file',
            path: content.path,
            name: content.path,
            format: 'text',
            content: null,
            created: '',
            writable: true,
            last_modified: '',
            mimetype: null,
          });
        });
      });
    });
  }

  /**
   * Create a checkpoint for a file.
   *
   * @param localPath - The path of the file.
   *
   * @returns A promise which resolves with the new checkpoint model when the
   *   checkpoint is created.
   */
  createCheckpoint(localPath: string): Promise<Contents.ICheckpointModel> {
    return new Promise((resolve, reject) => {
      // TODO(cbwilkes): Move to a services library.
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'gcp/v1/gcs/checkpoint'
      );
      const body = {
        action: 'createCheckpoint',
        localPath: localPath,
      };
      const requestInit: RequestInit = {
        body: JSON.stringify(body),
        method: 'POST',
      };
      ServerConnection.makeRequest(
        requestUrl,
        requestInit,
        serverSettings
      ).then(response => {
        response.json().then(content => {
          if (content.error) {
            console.error(content.error);
            reject(content.error);
            return;
          }
          resolve(content.checkpoint);
        });
      });
    });
  }

  /**
   * List available checkpoints for a file.
   *
   * @param localPath - The path of the file.
   *
   * @returns A promise which resolves with a list of checkpoint models for
   *    the file.
   */
  listCheckpoints(localPath: string): Promise<Contents.ICheckpointModel[]> {
    return new Promise((resolve, reject) => {
      // TODO(cbwilkes): Move to a services library.
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'gcp/v1/gcs/checkpoint'
      );
      const body = {
        action: 'listCheckpoints',
        localPath: localPath,
      };
      const requestInit: RequestInit = {
        body: JSON.stringify(body),
        method: 'POST',
      };
      ServerConnection.makeRequest(
        requestUrl,
        requestInit,
        serverSettings
      ).then(response => {
        response.json().then(content => {
          if (content.error) {
            console.error(content.error);
            reject(content.error);
            return;
          }
          resolve(content.checkpoints);
        });
      });
    });
  }

  /**
   * Restore a file to a known checkpoint state.
   *
   * @param localPath - The path of the file.
   *
   * @param checkpointID - The id of the checkpoint to restore.
   *
   * @returns A promise which resolves when the checkpoint is restored.
   */
  restoreCheckpoint(localPath: string, checkpointID: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // TODO(cbwilkes): Move to a services library.
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'gcp/v1/gcs/checkpoint'
      );
      const body = {
        action: 'restoreCheckpoint',
        localPath: localPath,
        checkpointID: checkpointID,
      };
      const requestInit: RequestInit = {
        body: JSON.stringify(body),
        method: 'POST',
      };
      ServerConnection.makeRequest(
        requestUrl,
        requestInit,
        serverSettings
      ).then(response => {
        response.json().then(content => {
          if (content.error) {
            console.error(content.error);
            reject(content.error);
            return;
          }
          resolve(void 0);
        });
      });
    });
  }

  /**
   * Delete a checkpoint for a file.
   *
   * @param localPath - The path of the file.
   *
   * @param checkpointID - The id of the checkpoint to delete.
   *
   * @returns A promise which resolves when the checkpoint is deleted.
   */
  deleteCheckpoint(localPath: string, checkpointID: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // TODO(cbwilkes): Move to a services library.
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'gcp/v1/gcs/checkpoint'
      );
      const body = {
        action: 'deleteCheckpoint',
        localPath: localPath,
        checkpointID: checkpointID,
      };
      const requestInit: RequestInit = {
        body: JSON.stringify(body),
        method: 'POST',
      };
      ServerConnection.makeRequest(
        requestUrl,
        requestInit,
        serverSettings
      ).then(response => {
        response.json().then(content => {
          if (content.error) {
            console.error(content.error);
            reject(content.error);
            return;
          }
          resolve(void 0);
        });
      });
    });
  }
}
