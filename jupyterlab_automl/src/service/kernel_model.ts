import { IClientSession } from '@jupyterlab/apputils';

import { Kernel, KernelMessage } from '@jupyterlab/services';

import { ISignal, Signal } from '@phosphor/signaling';

export class KernelModel {
  constructor(
    session: IClientSession,
    refresh: () => void,
    onError: () => void
  ) {
    this._session = session;
    this._refresh = refresh;
    this._onError = onError;
  }

  get future(): Kernel.IFuture<
    KernelMessage.IExecuteRequestMsg,
    KernelMessage.IExecuteReplyMsg
  > | null {
    return this._future;
  }

  set future(
    value: Kernel.IFuture<
      KernelMessage.IExecuteRequestMsg,
      KernelMessage.IExecuteReplyMsg
    > | null
  ) {
    this._future = value;
    if (!value) {
      return;
    }
    value.onIOPub = this._onIOPub;
  }

  get session(): IClientSession {
    return this._session;
  }

  get output(): string | null {
    return this._output;
  }

  get name(): string | null {
    return this._name;
  }

  get refresh(): () => void | null {
    return this._refresh;
  }

  get onError(): () => void | null {
    return this._onError;
  }

  get receivedData(): ISignal<KernelModel, void> {
    return this._receivedData;
  }

  get receivedError(): ISignal<KernelModel, string> {
    return this._receivedError;
  }

  createCSV(name: string, df: string) {
    this._name = name;
    if (!this._session || !this._session.kernel) {
      return;
    }
    const path = './' + df + '.csv';
    const run =
      "import base64;df.to_csv('" +
      path +
      "', index=False);base64.b64encode(open('" +
      path +
      "', 'r').read().encode('utf8')).decode('utf-8')";
    this.future = this._session.kernel.requestExecute({ code: run });
  }

  private _onIOPub = (msg: KernelMessage.IIOPubMessage) => {
    const msgType = msg.header.msg_type;
    switch (msgType) {
      case 'execute_result':
      case 'display_data':
      case 'update_display_data':
        this._output = msg.content['data']['text/plain'];
        this._receivedData.emit();
        break;
      case 'error':
        this._output = msg.content['evalue'];
        this._receivedError.emit(msg.content['ename']);
        break;
      default:
        break;
    }
    return;
  };

  private _future: Kernel.IFuture<
    KernelMessage.IExecuteRequestMsg,
    KernelMessage.IExecuteReplyMsg
  > | null = null;
  private _output: string | null = null;
  private _session: IClientSession;
  private _receivedData = new Signal<KernelModel, void>(this);
  private _receivedError = new Signal<KernelModel, string>(this);
  private _name: string | null = null;
  private _refresh: () => void | null = null;
  private _onError: () => void | null = null;
}
