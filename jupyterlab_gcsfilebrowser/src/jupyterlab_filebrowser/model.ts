// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {showDialog, Dialog} from '@jupyterlab/apputils';

import {
  IChangedArgs,
  IStateDB,
  PathExt,
  PageConfig,
  Poll
} from '@jupyterlab/coreutils';

import {IDocumentManager, shouldOverwrite} from '@jupyterlab/docmanager';

import {Contents, Kernel, Session} from '@jupyterlab/services';

import {IIconRegistry} from '@jupyterlab/ui-components';

import {
  ArrayIterator,
  each,
  find,
  IIterator,
  IterableOrArrayLike,
  ArrayExt,
  filter
} from '@phosphor/algorithm';

import {PromiseDelegate, ReadonlyJSONObject} from '@phosphor/coreutils';

import {IDisposable} from '@phosphor/disposable';

import {ISignal, Signal} from '@phosphor/signaling';

import {GCSDrive} from '../contents';

/**
 * The default duration of the auto-refresh in ms
 */
const DEFAULT_REFRESH_INTERVAL = 5000;

/**
 * The maximum upload size (in bytes) for notebook version < 5.1.0
 */
export const LARGE_FILE_SIZE = 15 * 1024 * 1024;

/**
 * The size (in bytes) of the biggest chunk we should upload at once.
 */
export const CHUNK_SIZE = 1024 * 1024;

/**
 * An upload progress event for a file at `path`.
 */
export interface IUploadModel {
  path: string;
  /**
   * % uploaded [0, 1)
   */
  progress: number;
}

/**
 * An implementation of a file browser model.
 *
 * #### Notes
 * All paths parameters without a leading `'/'` are interpreted as relative to
 * the current directory.  Supports `'../'` syntax.
 */
export class GCSFileBrowserModel implements IDisposable {
  /**
   * Construct a new file browser model.
   */
  constructor(options: GCSFileBrowserModel.IOptions) {
    this.iconRegistry = options.iconRegistry;
    this.manager = options.manager;
    this._driveName = options.driveName || '';
    let rootPath = this._driveName ? this._driveName + ':' : '';
    this._model = {
      path: rootPath,
      name: PathExt.basename(rootPath),
      type: 'directory',
      content: undefined,
      writable: false,
      created: 'unknown',
      last_modified: 'unknown',
      mimetype: 'text/plain',
      format: 'text'
    };
    this._state = options.state || null;
    const refreshInterval = options.refreshInterval || DEFAULT_REFRESH_INTERVAL;

    const {services} = options.manager;
    services.contents.fileChanged.connect(this._onFileChanged, this);
    services.sessions.runningChanged.connect(this._onRunningChanged, this);

    this._unloadEventListener = (e: Event) => {
      if (this._uploads.length > 0) {
        const confirmationMessage = 'Files still uploading';

        (e as any).returnValue = confirmationMessage;
        return confirmationMessage;
      }
    };
    window.addEventListener('beforeunload', this._unloadEventListener);
    this._poll = new Poll({
      factory: () => this.cd('.'),
      frequency: {
        interval: refreshInterval,
        backoff: true,
        max: 300 * 1000
      },
      standby: 'when-hidden'
    });
  }

  /**
   * The icon registry instance used by the file browser model.
   */
  readonly iconRegistry: IIconRegistry;

  /**
   * The document manager instance used by the file browser model.
   */
  readonly manager: IDocumentManager;

  /**
   * A signal emitted when the file browser model loses connection.
   */
  get connectionFailure(): ISignal<this, Error> {
    return this._connectionFailure;
  }

  /**
   * The drive name that gets prepended to the path.
   */
  get driveName(): string {
    return this._driveName;
  }

  /**
   * A promise that resolves when the model is first restored.
   */
  get restored(): Promise<void> {
    return this._restored.promise;
  }

  /**
   * Get the file path changed signal.
   */
  get fileChanged(): ISignal<this, Contents.IChangedArgs> {
    return this._fileChanged;
  }

  /**
   * Get the current path.
   */
  get path(): string {
    return this._model ? this._model.path : '';
  }

  /**
   * A signal emitted when the path changes.
   */
  get pathChanged(): ISignal<this, IChangedArgs<string>> {
    return this._pathChanged;
  }

  /**
   * A signal emitted when the directory listing is refreshed.
   */
  get refreshed(): ISignal<this, void> {
    return this._refreshed;
  }

  /**
   * Get the kernel spec models.
   */
  get specs(): Kernel.ISpecModels | null {
    return this.manager.services.sessions.specs;
  }

  /**
   * Get whether the model is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * A signal emitted when an upload progresses.
   */
  get uploadChanged(): ISignal<this, IChangedArgs<IUploadModel>> {
    return this._uploadChanged;
  }

  /**
   * Create an iterator over the status of all in progress uploads.
   */
  uploads(): IIterator<IUploadModel> {
    return new ArrayIterator(this._uploads);
  }

  /**
   * Dispose of the resources held by the model.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    window.removeEventListener('beforeunload', this._unloadEventListener);
    this._isDisposed = true;
    this._poll.dispose();
    this._sessions.length = 0;
    this._items.length = 0;
    Signal.clearData(this);
  }

  /**
   * Create an iterator over the model's items.
   *
   * @returns A new iterator over the model's items.
   */
  items(): IIterator<Contents.IModel> {
    return new ArrayIterator(this._items);
  }

  /**
   * Create an iterator over the active sessions in the directory.
   *
   * @returns A new iterator over the model's active sessions.
   */
  sessions(): IIterator<Session.IModel> {
    return new ArrayIterator(this._sessions);
  }

  /**
   * Force a refresh of the directory contents.
   */
  async refresh(): Promise<void> {
    await this._poll.refresh();
    await this._poll.tick;
  }

  /**
   * Change directory.
   *
   * @param path - The path to the file or directory.
   *
   * @returns A promise with the contents of the directory.
   */
  async cd(newValue = '.'): Promise<void> {
    if (newValue !== '.') {
      let postPend = ''
      if (newValue.length > 1 && newValue[newValue.length - 1] === '/') {
        postPend = '/';
      }
      newValue = Private.normalizePath(
        this.manager.services.contents,
        this._model.path,
        newValue
      ) + postPend;
    } else {
      newValue = this._pendingPath || this._model.path;
    }
    if (this._pending) {
      // Collapse requests to the same directory.
      if (newValue === this._pendingPath) {
        return this._pending;
      }
      // Otherwise wait for the pending request to complete before continuing.
      await this._pending;
    }
    let oldValue = this.path;
    let options: Contents.IFetchOptions = {content: true};
    this._pendingPath = newValue;
    if (oldValue !== newValue) {
      this._sessions.length = 0;
    }
    let handleContents = (contents: any) => {
      if (this.isDisposed) {
        return;
      }
      this._handleContents(contents);
      this._pendingPath = null;
      this._pending = null;
      if (oldValue !== newValue) {
        // If there is a state database and a unique key, save the new path.
        // We don't need to wait on the save to continue.
        if (this._state && this._key) {
          void this._state.save(this._key, {path: newValue});
        }

        this._pathChanged.emit({
          name: 'path',
          oldValue,
          newValue
        });
      }
      this._onRunningChanged(services.sessions, services.sessions.running());
      this._refreshed.emit(void 0);
    }
    let handleError = (error: any) => {
      this._pendingPath = null;
      this._pending = null;
      if (error.response && error.response.status === 404) {
        error.message = `Directory not found: "${this._model.path}"`;
        console.error(error);
        this._connectionFailure.emit(error);
        return this.cd('/');
      } else {
        this._connectionFailure.emit(error);
      }
    };

    let services = this.manager.services;
    if (newValue === '') {
      newValue = this._driveName ? this._driveName + ':' : '';
    }
    this._pending = this.getGCSDriveContents(newValue, options)
      .then(handleContents)
      .catch(handleError);
    return this._pending;
  }

  getGCSDriveContents(newValue: string, options: Contents.IFetchOptions) {
    let driveName = this.manager.services.contents.driveName(newValue);
    let drive = this._additionalDrives.get(driveName);
    if (drive === undefined && this._additionalDrives.size) {
      drive = this._additionalDrives.values().next().value;
    }

    let postPend = ''
    if (newValue.length > 1 && newValue[newValue.length - 1] === '/') {
      postPend = '/';
    }
    let localPath = this.manager.services.contents.localPath(newValue) + postPend;

    return drive.get(localPath, options).then(contentsModel => {
      let listing: Contents.IModel[] = [];
      if (contentsModel.type === 'directory' && contentsModel.content) {
        each(contentsModel.content, (item: Contents.IModel) => {
          listing.push({
            ...item,
            path: this._toGlobalPath(drive, item.path)
          } as Contents.IModel);
        });
        return {
          ...contentsModel,
          path: this._toGlobalPath(drive, localPath),
          content: listing
        } as Contents.IModel;
      } else {
        return {
          ...contentsModel,
          path: this._toGlobalPath(drive, localPath)
        } as Contents.IModel;
      }
    });

  }

  addGCSDrive(drive: GCSDrive) {
    this._additionalDrives.set(drive.name, drive);
  }

  private _additionalDrives = new Map<string, Contents.IDrive>();

  /**
   * Given a drive and a local path, construct a fully qualified
   * path. The inverse of `_driveForPath`.
   *
   * @param drive: an `IDrive`.
   *
   * @param localPath: the local path on the drive.
   *
   * @returns the fully qualified path.
   */
  private _toGlobalPath(drive: Contents.IDrive, localPath: string): string {
    return `${drive.name}:${PathExt.removeSlash(localPath)}`;
  }

  /**
   * Download a file.
   *
   * @param path - The path of the file to be downloaded.
   *
   * @returns A promise which resolves when the file has begun
   *   downloading.
   */
  async download(path: string): Promise<void> {
    const url = await this.manager.services.contents.getDownloadUrl(path);
    let element = document.createElement('a');
    element.href = url;
    element.download = '';
    element.target = '_blank';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    return void 0;
  }

  /**
   * Restore the state of the file browser.
   *
   * @param id - The unique ID that is used to construct a state database key.
   *
   * @returns A promise when restoration is complete.
   *
   * #### Notes
   * This function will only restore the model *once*. If it is called multiple
   * times, all subsequent invocations are no-ops.
   */
  restore(id: string): Promise<void> {
    const state = this._state;
    const restored = !!this._key;
    if (!state || restored) {
      return Promise.resolve(void 0);
    }

    const manager = this.manager;
    const key = `file-browser-${id}:cwd`;
    const ready = manager.services.ready;
    return Promise.all([state.fetch(key), ready])
      .then(([value]) => {
        if (!value) {
          this._restored.resolve(undefined);
          return;
        }

        const path = (value as ReadonlyJSONObject)['path'] as string;
        const localPath = manager.services.contents.localPath(path);
        return manager.services.contents
          .get(path)
          .then(() => this.cd(localPath))
          .catch(() => state.remove(key));
      })
      .catch(() => state.remove(key))
      .then(() => {
        this._key = key;
        this._restored.resolve(undefined);
      }); // Set key after restoration is done.
  }

  /**
   * Upload a `File` object.
   *
   * @param file - The `File` object to upload.
   *
   * @returns A promise containing the new file contents model.
   *
   * #### Notes
   * On Notebook version < 5.1.0, this will fail to upload files that are too
   * big to be sent in one request to the server. On newer versions, it will
   * ask for confirmation then upload the file in 1 MB chunks.
   */
  async upload(file: File): Promise<Contents.IModel> {
    const supportsChunked = PageConfig.getNotebookVersion() >= [5, 1, 0];
    const largeFile = file.size > LARGE_FILE_SIZE;

    // Cannot upload to the root directory which contains a list of buckets
    if (this._model.path.endsWith(":") || this._model.path.endsWith(":/")) {
      let msg = `Cannot upload file to root GCS directory. You must first open a GCS bucket directory in order to upload.`;
      console.warn(msg);
      throw msg;
    }

    if (largeFile && !supportsChunked) {
      let msg = `Cannot upload file (>${LARGE_FILE_SIZE / (1024 * 1024)} MB). ${
        file.name
        }`;
      console.warn(msg);
      throw msg;
    }

    const err = 'File not uploaded';
    if (largeFile && !(await this._shouldUploadLarge(file))) {
      throw 'Cancelled large file upload';
    }
    await this._uploadCheckDisposed();
    await this.refresh();
    await this._uploadCheckDisposed();
    if (
      find(this._items, i => i.name === file.name) &&
      !(await shouldOverwrite(file.name))
    ) {
      throw err;
    }
    await this._uploadCheckDisposed();
    const chunkedUpload = supportsChunked && file.size > CHUNK_SIZE;
    return await this._upload(file, chunkedUpload);
  }

  private async _shouldUploadLarge(file: File): Promise<boolean> {
    const {button} = await showDialog({
      title: 'Large file size warning',
      body: `The file size is ${Math.round(
        file.size / (1024 * 1024)
      )} MB. Do you still want to upload it?`,
      buttons: [Dialog.cancelButton(), Dialog.warnButton({label: 'Upload'})]
    });
    return button.accept;
  }

  /**
   * Perform the actual upload.
   */
  private async _upload(
    file: File,
    chunked: boolean
  ): Promise<Contents.IModel> {
    // Gather the file model parameters.
    let path = this._model.path;
    path = path ? path + '/' + file.name : file.name;
    let name = file.name;
    let type: Contents.ContentType = 'file';
    let format: Contents.FileFormat = 'base64';

    const uploadInner = async (
      blob: Blob,
      chunk?: number
    ): Promise<Contents.IModel> => {
      await this._uploadCheckDisposed();
      let reader = new FileReader();
      reader.readAsDataURL(blob);
      await new Promise((resolve, reject) => {
        reader.onload = resolve;
        reader.onerror = event =>
          reject(`Failed to upload "${file.name}":` + event);
      });
      await this._uploadCheckDisposed();

      // remove header https://stackoverflow.com/a/24289420/907060
      const content = (reader.result as string).split(',')[1];

      let model: Partial<Contents.IModel> = {
        type,
        format,
        name,
        chunk,
        content
      };
      return await this.manager.services.contents.save(path, model);
    };

    if (!chunked) {
      try {
        return await uploadInner(file);
      } catch (err) {
        ArrayExt.removeFirstWhere(this._uploads, uploadIndex => {
          return file.name === uploadIndex.path;
        });
        throw err;
      }
    }

    let finalModel: Contents.IModel;

    let upload = {path, progress: 0};
    this._uploadChanged.emit({
      name: 'start',
      newValue: upload,
      oldValue: null
    });

    for (let start = 0; !finalModel; start += CHUNK_SIZE) {
      const end = start + CHUNK_SIZE;
      const lastChunk = end >= file.size;
      const chunk = lastChunk ? -1 : end / CHUNK_SIZE;

      const newUpload = {path, progress: start / file.size};
      this._uploads.splice(this._uploads.indexOf(upload));
      this._uploads.push(newUpload);
      this._uploadChanged.emit({
        name: 'update',
        newValue: newUpload,
        oldValue: upload
      });
      upload = newUpload;

      let currentModel: Contents.IModel;
      try {
        currentModel = await uploadInner(file.slice(start, end), chunk);
      } catch (err) {
        ArrayExt.removeFirstWhere(this._uploads, uploadIndex => {
          return file.name === uploadIndex.path;
        });

        this._uploadChanged.emit({
          name: 'failure',
          newValue: upload,
          oldValue: null
        });

        throw err;
      }

      if (lastChunk) {
        finalModel = currentModel;
      }
    }

    this._uploads.splice(this._uploads.indexOf(upload));
    this._uploadChanged.emit({
      name: 'finish',
      newValue: null,
      oldValue: upload
    });

    return finalModel;
  }

  private _uploadCheckDisposed(): Promise<void> {
    if (this.isDisposed) {
      return Promise.reject('Filemanager disposed. File upload canceled');
    }
    return Promise.resolve();
  }

  /**
   * Handle an updated contents model.
   */
  private _handleContents(contents: Contents.IModel): void {
    // Update our internal data.
    this._model = {
      name: contents.name,
      path: contents.path,
      type: contents.type,
      content: undefined,
      writable: contents.writable,
      created: contents.created,
      last_modified: contents.last_modified,
      mimetype: contents.mimetype,
      format: contents.format
    };
    this._items = contents.content;
    this._paths.clear();
    contents.content.forEach((model: Contents.IModel) => {
      this._paths.add(model.path);
    });
  }

  /**
   * Handle a change to the running sessions.
   */
  private _onRunningChanged(
    sender: Session.IManager,
    models: IterableOrArrayLike<Session.IModel>
  ): void {
    this._populateSessions(models);
    this._refreshed.emit(void 0);
  }

  /**
   * Handle a change on the contents manager.
   */
  private _onFileChanged(
    sender: Contents.IManager,
    change: Contents.IChangedArgs
  ): void {
    let path = this._model.path;
    let {sessions} = this.manager.services;
    let {oldValue, newValue} = change;
    let value =
      oldValue && oldValue.path && PathExt.dirname(oldValue.path) === path
        ? oldValue
        : newValue && newValue.path && PathExt.dirname(newValue.path) === path
          ? newValue
          : undefined;

    // If either the old value or the new value is in the current path, update.
    if (value) {
      void this._poll.refresh();
      this._populateSessions(sessions.running());
      this._fileChanged.emit(change);
      return;
    }
  }

  /**
   * Populate the model's sessions collection.
   */
  private _populateSessions(models: IterableOrArrayLike<Session.IModel>): void {
    this._sessions.length = 0;
    each(models, model => {
      if (this._paths.has(model.path)) {
        this._sessions.push(model);
      }
    });
  }

  private _connectionFailure = new Signal<this, Error>(this);
  private _fileChanged = new Signal<this, Contents.IChangedArgs>(this);
  private _items: Contents.IModel[] = [];
  private _key: string = '';
  private _model: Contents.IModel;
  private _pathChanged = new Signal<this, IChangedArgs<string>>(this);
  private _paths = new Set<string>();
  private _pending: Promise<void> | null = null;
  private _pendingPath: string | null = null;
  private _refreshed = new Signal<this, void>(this);
  private _sessions: Session.IModel[] = [];
  private _state: IStateDB | null = null;
  private _driveName: string;
  private _isDisposed = false;
  private _restored = new PromiseDelegate<void>();
  private _uploads: IUploadModel[] = [];
  private _uploadChanged = new Signal<this, IChangedArgs<IUploadModel>>(this);
  private _unloadEventListener: (e: Event) => string;
  private _poll: Poll;
}

/**
 * The namespace for the `FileBrowserModel` class statics.
 */
export namespace GCSFileBrowserModel {
  /**
   * An options object for initializing a file browser.
   */
  export interface IOptions {
    /**
     * An icon registry instance.
     */
    iconRegistry: IIconRegistry;

    /**
     * A document manager instance.
     */
    manager: IDocumentManager;

    /**
     * An optional `Contents.IDrive` name for the model.
     * If given, the model will prepend `driveName:` to
     * all paths used in file operations.
     */
    driveName?: string;

    /**
     * The time interval for browser refreshing, in ms.
     */
    refreshInterval?: number;

    /**
     * An optional state database. If provided, the model will restore which
     * folder was last opened when it is restored.
     */
    state?: IStateDB;
  }
}

/**
 * File browser model with optional filter on element.
 */
export class FilterFileBrowserModel extends GCSFileBrowserModel {
  constructor(options: FilterFileBrowserModel.IOptions) {
    super(options);

    this._filter = options.filter ? options.filter : model => true;
  }

  /**
   * Create an iterator over the filtered model's items.
   *
   * @returns A new iterator over the model's items.
   */
  items(): IIterator<Contents.IModel> {
    return filter(super.items(), (value, index) => {
      if (value.type === 'directory') {
        return true;
      } else {
        return this._filter(value);
      }
    });
  }

  private _filter: (value: Contents.IModel) => boolean;
}

/**
 * Namespace for the filtered file browser model
 */
export namespace FilterFileBrowserModel {
  /**
   * Constructor options
   */
  export interface IOptions extends GCSFileBrowserModel.IOptions {
    /**
     * Filter function on file browser item model
     */
    filter?: (value: Contents.IModel) => boolean;
  }
}

/**
 * The namespace for the file browser model private data.
 */
namespace Private {
  /**
   * Normalize a path based on a root directory, accounting for relative paths.
   */
  export function normalizePath(
    contents: Contents.IManager,
    root: string,
    path: string
  ): string {
    const driveName = contents.driveName(root);
    const localPath = contents.localPath(root);
    const resolved = PathExt.resolve(localPath, path);
    return driveName ? `${driveName}:${resolved}` : resolved;
  }
}
