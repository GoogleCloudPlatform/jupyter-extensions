import { CodeMirror } from 'codemirror';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { default as merge } from 'diff3';

function token() {
  let token = '';
  while (token.length < 32)
    token += Math.random()
      .toString(36)
      .substr(2);
  return '/$*' + token + '*$/';
}

interface Versions {
  base: string;
  local: string;
  remote: string;
}

export class MergeResolver {
  _path: string;
  _token: string = token();
  _cursor: CodeMirror.Pos;
  _versions: Versions = {
    base: undefined,
    local: undefined,
    remote: undefined,
  };

  constructor(path: string) {
    this._path = path;
  }

  getCursor() {
    return this._cursor;
  }

  setCursorToken(pos: CodeMirror.Pos) {
    const text = this._versions.local.split('\n');
    let line = text[pos.line];

    const before = line.slice(0, pos.ch);
    const after = line.slice(pos.ch);
    line = before + this._token + after;

    text[pos.line] = line;
    this._versions.local = text.join('\n');
  }

  private _removeCursorToken(input: string) {
    const text = input.split('\n');
    for (let i = 0; i < text.length; i++) {
      if (text[i].indexOf(this._token) > -1) {
        const line = i;
        const ch = text[i].indexOf(this._token);
        this._cursor = { line: line, ch: ch };
        break;
      }
    }
    return input.replace(this._token, '');
  }

  addVersion(text: string, origin: 'base' | 'local' | 'remote'): void {
    this._versions[origin] = text;
  }

  async mergeVersions(): Promise<string> {
    const merged = merge(
      this._versions.remote,
      this._versions.base,
      this._versions.local
    );
    if (this._isConflict(merged)) {
      await this._resolveConflicts(merged);
    } else {
      let text = this._mergeResult(merged[0]);
      text = this._removeCursorToken(text);
      this.addVersion(text, 'base');
    }
    return this._versions.base;
  }

  private _isConflict(merged): boolean {
    return merged.length > 1 || !merged[0] || merged[0].conflict;
  }

  private _mergeResult(merged): string {
    return merged ? merged.ok.join('') : '';
  }

  private async _resolveConflicts(merged): Promise<void> {
    let resolved = true;
    const result = merged.map(segment => {
      if (segment.ok) return this._mergeResult(segment);

      const base = segment.conflict.o;
      const remote = segment.conflict.a;
      const local = segment.conflict.b;

      const content = this._resolveFalseConflict(base, remote, local);
      if (!content) resolved = false;

      return content ? content : segment;
    });

    if (resolved) {
      let text = result.join('');
      text = this._removeCursorToken(text);
      this.addVersion(text, 'base');
    } else {
      await this._resolveDialog(result);
    }
  }

  private _resolveFalseConflict(base, remote, local): string {
    let ret = undefined;
    const local_raw = local.replace(this._token, '');

    if (
      base === '' &&
      (local_raw.startsWith(remote) || remote.startsWith(local_raw))
    )
      ret = (local_raw.startsWith(remote) ? local_raw : remote).replace(
        local_raw,
        local
      );
    else {
      console.log(base);
      console.log(local);
      console.log(remote);
    }
    return ret;
  }

  private async _resolveDialog(result): Promise<void> {
    const body = `"${this._path}" has a conflict. Would you like to revert to a previous version or resolve the conflict?`;
    const resolveBtn = Dialog.okButton({ label: 'Resolve Conflicts' });
    const localBtn = Dialog.okButton({ label: 'Revert to Local' });
    const remoteBtn = Dialog.okButton({ label: 'Revert to Remote' });
    return showDialog({
      title: 'Merge Conflicts',
      body,
      buttons: [remoteBtn, localBtn, resolveBtn],
    }).then(result => {
      if (result.button.label === 'Revert to Local') {
        const text = this._removeCursorToken(this._versions.local);
        this.addVersion(text, 'base');
      }
      if (result.button.label === 'Revert to Remote') {
        this.addVersion(this._versions.remote, 'base');
        this._cursor = { line: 0, ch: 0 };
      }
      if (result.button.label === 'Resolve Conflicts') {
        console.log('do something');
        // TO DO: open an editor for 3 way merging
      }
    });
  }
}
