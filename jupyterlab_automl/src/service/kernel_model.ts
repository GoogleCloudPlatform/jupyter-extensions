import { IClientSession } from '@jupyterlab/apputils';

import { Kernel, KernelMessage } from '@jupyterlab/services';

import { ISignal, Signal } from '@phosphor/signaling';

export class KernelModel {
  constructor(
    session: IClientSession,
    refresh: () => void,
    onError: (error: string) => void
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

  get refresh(): () => void | null {
    return this._refresh;
  }

  get onError(): (error: string) => void | null {
    return this._onError;
  }

  get receivedSuccess(): ISignal<KernelModel, void> {
    return this._receivedSuccess;
  }

  get receivedError(): ISignal<KernelModel, string> {
    return this._receivedError;
  }

  createCSV(name: string, df: string) {
    if (!this._session || !this._session.kernel) {
      return;
    }
    const run =
      "import jupyterlab_automl; jupyterlab_automl.create_dataset_from_dataframe('" +
      name +
      "', " +
      df +
      ')';
    this.future = this._session.kernel.requestExecute({ code: run });
  }

  private _onIOPub = (msg: KernelMessage.IIOPubMessage) => {
    const msgType = msg.header.msg_type;
    switch (msgType) {
      case 'execute_result':
      case 'display_data':
      case 'update_display_data':
        this._receivedSuccess.emit();
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
  private _receivedSuccess = new Signal<KernelModel, void>(this);
  private _receivedError = new Signal<KernelModel, string>(this);
  private _refresh: () => void | null = null;
  private _onError: (error: string) => void | null = null;
}
