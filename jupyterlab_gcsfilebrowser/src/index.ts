// Ensure styles are loaded by webpack
import '../style/index.css';

import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { IDocumentManager } from '@jupyterlab/docmanager';
import { IGCSFileBrowserFactory } from './jupyterlab_filebrowser/tokens';
import { GCSDrive } from './contents';

import { IStatusBar } from '@jupyterlab/statusbar';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import {
  Clipboard,
  MainAreaWidget,
  ToolbarButton,
  WidgetTracker,
} from '@jupyterlab/apputils';

import { IStateDB } from '@jupyterlab/coreutils';

import { CommandRegistry } from '@phosphor/commands';

import { Launcher } from '@jupyterlab/launcher';

import { GCSFileBrowser } from './jupyterlab_filebrowser/browser';
import { GCSFileBrowserModel } from './jupyterlab_filebrowser/model';

import { FileUploadStatus } from './jupyterlab_filebrowser/uploadstatus';

import { IIconRegistry } from '@jupyterlab/ui-components';

import { map, toArray } from '@phosphor/algorithm';
import { Widget, PanelLayout } from '@phosphor/widgets';
import { h, VirtualDOM } from '@phosphor/virtualdom';
import { stylesheet } from 'typestyle';

const NAMESPACE = 'gcsfilebrowser';
const GCS_URI_PREFIX = 'gs://';

const localStyles = stylesheet({
  header: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    fontWeight: 600,
    fontSize: 'var(--jp-ui-font-size0, 11px)',
    letterSpacing: '1px',
    margin: 0,
    padding: '8px 12px',
    textTransform: 'uppercase',
    backgroundColor: 'white',
  },
});

class GCSBrowserWidget extends Widget {
  constructor(browser: GCSFileBrowser) {
    super();
    this.addClass('jp-GCSBrowser');
    this.layout = new PanelLayout();
    const header = new Widget({
      node: VirtualDOM.realize(
        h.div({ className: localStyles.header }, 'Google Cloud Storage')
      ),
    });

    (this.layout as PanelLayout).addWidget(header);
    (this.layout as PanelLayout).addWidget(browser);
  }
}

async function activateGCSFileBrowser(
  app: JupyterFrontEnd,
  manager: IDocumentManager,
  factory_browser: IFileBrowserFactory,
  factory: IGCSFileBrowserFactory,
  restorer: ILayoutRestorer
) {
  const drive = new GCSDrive();
  manager.services.contents.addDrive(drive);

  const browser = factory.createFileBrowser(NAMESPACE, {
    driveName: drive.name,
  });

  factory_browser.createFileBrowser(NAMESPACE, {
    driveName: drive.name,
  });

  browser.model.addGCSDrive(drive);
  const mybrowser = new GCSBrowserWidget(browser);
  mybrowser.addClass('jp-GCSFilebrowser');

  mybrowser.title.iconClass = 'jp-GCSFilebrowserIcon jp-SideBar-tabIcon';
  mybrowser.title.caption = 'Browse GCS';
  mybrowser.id = 'gcs-filebrowser-widget';

  restorer.add(mybrowser, NAMESPACE);
  app.shell.add(mybrowser, 'left', { rank: 100 });

  addCommands(app, factory);
}

/**
 * A plugin providing file upload status.
 */
export const fileUploadStatus: JupyterFrontEndPlugin<void> = {
  id: 'gcsfilebrowser-extension:file-upload-status',
  autoStart: true,
  requires: [IGCSFileBrowserFactory],
  optional: [IStatusBar],
  activate: (
    app: JupyterFrontEnd,
    browser: IGCSFileBrowserFactory,
    statusBar: IStatusBar | null
  ) => {
    if (!statusBar) {
      // Automatically disable if statusbar missing
      return;
    }
    const item = new FileUploadStatus({
      tracker: browser.tracker,
    });

    statusBar.registerStatusItem(
      'gcsfilebrowser-extension:file-upload-status',
      {
        item,
        align: 'middle',
        isActive: () => {
          return !!item.model && item.model.items.length > 0;
        },
        activeStateChanged: item.model.stateChanged,
      }
    );
  },
};

/**
 * The command IDs used by the file browser plugin.
 */
namespace CommandIDs {
  export const copyGCSURI = 'gcsfilebrowser:copy-gcs-uri';
  export const del = 'gcsfilebrowser:delete';
  export const rename = 'gcsfilebrowser:rename';
  export const copy = 'gcsfilebrowser:copy';
  export const cut = 'gcsfilebrowser:cut';
  export const duplicate = 'gcsfilebrowser:duplicate';
  export const paste = 'gcsfilebrowser:paste';
  export const open = 'gcsfilebrowser:open';
  export const download = 'gcsfilebrowser:download';
  export const createNewDirectory = 'gcsfilebrowser:create-new-directory';
}

function addCommands(app: JupyterFrontEnd, factory: IGCSFileBrowserFactory) {
  const { docRegistry: registry, commands } = app;
  const { tracker } = factory;

  commands.addCommand(CommandIDs.open, {
    execute: args => {
      const factory = (args['factory'] as string) || void 0;
      const widget = tracker.currentWidget;

      if (!widget) {
        return;
      }

      const { contents } = widget.model.manager.services;
      return Promise.all(
        toArray(
          map(widget.selectedItems(), item => {
            if (item.type === 'directory') {
              const localPath = contents.localPath(item.path);
              return widget.model.cd(`/${localPath}`);
            }

            return commands.execute('docmanager:open', {
              factory: factory,
              path: item.path,
            });
          })
        )
      );
    },
    iconClass: args => {
      const factory = (args['factory'] as string) || void 0;
      if (factory) {
        // if an explicit factory is passed...
        const ft = registry.getFileType(factory);
        if (ft) {
          // ...set an icon if the factory name corresponds to a file type name...
          return ft.iconClass;
        } else {
          // ...or leave the icon blank
          return '';
        }
      } else {
        return 'jp-MaterialIcon jp-FolderIcon';
      }
    },
    label: args => (args['label'] || args['factory'] || 'Open') as string,
    mnemonic: 0,
  });

  commands.addCommand(CommandIDs.copy, {
    execute: () => {
      const widget = tracker.currentWidget;

      if (widget) {
        return widget.copy();
      }
    },
    iconClass: 'jp-MaterialIcon jp-CopyIcon',
    label: 'Copy',
    mnemonic: 0,
  });

  commands.addCommand(CommandIDs.duplicate, {
    execute: () => {
      const widget = tracker.currentWidget;

      if (widget) {
        return widget.duplicate();
      }
    },
    iconClass: 'jp-MaterialIcon jp-CopyIcon',
    label: 'Duplicate',
  });

  commands.addCommand(CommandIDs.cut, {
    execute: () => {
      const widget = tracker.currentWidget;

      if (widget) {
        return widget.cut();
      }
    },
    iconClass: 'jp-MaterialIcon jp-CutIcon',
    label: 'Cut',
  });

  commands.addCommand(CommandIDs.paste, {
    execute: () => {
      const widget = tracker.currentWidget;

      if (widget) {
        return widget.paste();
      }
    },
    iconClass: 'jp-MaterialIcon jp-PasteIcon',
    label: 'Paste',
    mnemonic: 0,
  });

  commands.addCommand(CommandIDs.rename, {
    execute: args => {
      const widget = tracker.currentWidget;

      if (widget) {
        return widget.rename();
      }
    },
    iconClass: 'jp-MaterialIcon jp-EditIcon',
    label: 'Rename',
    mnemonic: 0,
  });

  commands.addCommand(CommandIDs.del, {
    execute: () => {
      const widget = tracker.currentWidget;

      if (widget) {
        return widget.delete();
      }
    },
    iconClass: 'jp-MaterialIcon jp-CloseIcon',
    label: 'Delete',
    mnemonic: 0,
  });

  commands.addCommand(CommandIDs.copyGCSURI, {
    execute: () => {
      const widget = tracker.currentWidget;
      if (!widget) {
        return;
      }

      const localPath = widget.model.manager.services.contents.localPath(
        widget.selectedItems().next()!.path
      );
      Clipboard.copyToSystem(GCS_URI_PREFIX + localPath);
    },
    iconClass: 'jp-MaterialIcon jp-CopyIcon',
    label: 'Copy GCS URI (gs://)',
    mnemonic: 0,
  });

  commands.addCommand(CommandIDs.download, {
    execute: () => {
      const widget = tracker.currentWidget;

      if (widget) {
        return widget.download();
      }
    },
    iconClass: 'jp-MaterialIcon jp-DownloadIcon',
    label: 'Download',
  });

  commands.addCommand(CommandIDs.createNewDirectory, {
    execute: () => {
      const widget = tracker.currentWidget;

      if (widget) {
        return widget.createNewDirectory();
      }
    },
    iconClass: 'jp-MaterialIcon jp-NewFolderIcon',
    label: 'New Folder',
  });

  // matches anywhere on filebrowser
  const selectorContent = '.jp-gcs-DirListing-content';
  // matches all filebrowser items
  const selectorItem = '.jp-gcs-DirListing-item[data-isdir]';
  // matches only non-directory items
  const selectorNotDir = '.jp-gcs-DirListing-item[data-isdir="false"]';

  app.contextMenu.addItem({
    command: CommandIDs.open,
    selector: selectorItem,
    rank: 1,
  });
  app.contextMenu.addItem({
    command: CommandIDs.cut,
    selector: selectorItem,
    rank: 2,
  });
  app.contextMenu.addItem({
    command: CommandIDs.copy,
    selector: selectorNotDir,
    rank: 3,
  });
  app.contextMenu.addItem({
    command: CommandIDs.duplicate,
    selector: selectorNotDir,
    rank: 4,
  });
  app.contextMenu.addItem({
    command: CommandIDs.createNewDirectory,
    selector: selectorContent,
    rank: 5,
  });
  app.contextMenu.addItem({
    command: CommandIDs.paste,
    selector: selectorContent,
    rank: 6,
  });
  app.contextMenu.addItem({
    command: CommandIDs.copyGCSURI,
    selector: selectorNotDir,
    rank: 7,
  });
  app.contextMenu.addItem({
    command: CommandIDs.rename,
    selector: selectorItem,
    rank: 8,
  });
  app.contextMenu.addItem({
    command: CommandIDs.del,
    selector: selectorItem,
    rank: 9,
  });
  app.contextMenu.addItem({
    command: CommandIDs.download,
    selector: selectorNotDir,
    rank: 10,
  });
}

/**
 * The JupyterLab plugin for the GCS Filebrowser.
 */
const GCSFileBrowserPlugin: JupyterFrontEndPlugin<void> = {
  id: 'gcsfilebrowser:drive',
  requires: [
    IDocumentManager,
    IFileBrowserFactory,
    IGCSFileBrowserFactory,
    ILayoutRestorer,
  ],
  activate: activateGCSFileBrowser,
  autoStart: true,
};

/**
 * Activate the file browser factory provider.
 */
function activateFactory(
  app: JupyterFrontEnd,
  icoReg: IIconRegistry,
  docManager: IDocumentManager,
  state: IStateDB
): IGCSFileBrowserFactory {
  const { commands } = app;
  const tracker = new WidgetTracker<GCSFileBrowser>({ namespace: NAMESPACE });
  const createFileBrowser = (
    id: string,
    options: IGCSFileBrowserFactory.IOptions = {}
  ) => {
    const model = new GCSFileBrowserModel({
      iconRegistry: icoReg,
      manager: docManager,
      driveName: options.driveName || '',
      refreshInterval: options.refreshInterval,
      state: options.state === null ? null : options.state || state,
    });
    const widget = new GCSFileBrowser({
      id,
      model,
    });

    // Add a launcher toolbar item.
    const launcher = new ToolbarButton({
      iconClassName: 'jp-AddIcon',
      onClick: () => {
        return Private.createLauncher(commands, widget);
      },
      tooltip: 'New Launcher',
    });
    widget.toolbar.insertItem(0, 'launch', launcher);

    // Track the newly created file browser.
    void tracker.add(widget);

    return widget;
  };

  return { createFileBrowser, tracker };
}

/**
 * The default file browser factory provider.
 */
const factory: JupyterFrontEndPlugin<IGCSFileBrowserFactory> = {
  activate: activateFactory,
  id: 'gcsfilebrowser-extension:factory',
  provides: IGCSFileBrowserFactory,
  requires: [IIconRegistry, IDocumentManager, IStateDB],
};

/**
 * A namespace for private module data.
 */
namespace Private {
  /**
   * Create a launcher for a given filebrowser widget.
   */
  export function createLauncher(
    commands: CommandRegistry,
    browser: GCSFileBrowser
  ): Promise<MainAreaWidget<Launcher>> {
    const { model } = browser;

    return commands
      .execute('launcher:create', { cwd: model.path })
      .then((launcher: MainAreaWidget<Launcher>) => {
        model.pathChanged.connect(() => {
          launcher.content.cwd = model.path;
        }, launcher);
        return launcher;
      });
  }
}

/**
 * Export the plugin as default.
 */
export default [factory, GCSFileBrowserPlugin, fileUploadStatus];
export * from './jupyterlab_filebrowser/tokens';
