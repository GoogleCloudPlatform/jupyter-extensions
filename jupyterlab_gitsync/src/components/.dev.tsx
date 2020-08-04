import * as React from 'react';
import { style } from 'typestyle';

import { Props } from './panel';
import { ToolbarButton } from './toolbar_btn_template'

export interface State {
  value?: any;
}

export class LogViewerButton extends ToolbarButton {
  constructor(props) {
    super(
      props,
      'Log Current View',
      style({ backgroundImage: 'var(--jp-icon-circle)' })
    );
  }

  protected _onClick = (): void => {
    return;
  };
}

export class SetViewButton extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      value: ''
    };

  }

  onSubmit = (event): void => {
    event.preventDefault();
    var input = this.state.value.split(' ');
    var pos = {}
    if (input[0] == 'left' && input[2] == 'top'){
      pos = { left: input[1], top: input[3]};
    } else if(input[2] == 'left' && input[0] == 'top'){
      pos = { left: input[3], top: input[1]};
      this.props.service.tracker.current.editor.scrollIntoView(pos);
    } else if (input[0] == 'from' && input[2] == 'to'){
      pos = { from: input[1], to: input[3]};
      this.props.service.tracker.current.editor.scrollIntoView(pos);
    } else {
      var res = eval(input[0]);
      // 'this.props.service.tracker.current.'+
      console.log(res);
    }
    
  }

  onChange = (event): void => {
    this.setState({value: event.target.value});
  }

  render(): React.ReactElement {
    return(
      <form onSubmit={this.onSubmit}>
        <label> Position:
          <input type="text" value={this.state.value} onChange={this.onChange} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    );
  }
  
}