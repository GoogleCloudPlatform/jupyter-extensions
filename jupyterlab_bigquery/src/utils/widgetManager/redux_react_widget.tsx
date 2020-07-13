import { ReactWidget } from '@jupyterlab/apputils';
import { Provider, ProviderProps } from 'react-redux';
import React from 'react';

declare type ReactRenderElement =
  | Array<React.ReactElement<any>>
  | React.ReactElement<any>;

export abstract class ReduxReactWidget extends ReactWidget {
  private providerProps: ProviderProps;

  protected abstract renderReact(): ReactRenderElement;

  setProviderProps(props: ProviderProps) {
    this.providerProps = props;
  }

  render() {
    return <Provider {...this.providerProps}>{this.renderReact()}</Provider>;
  }
}
