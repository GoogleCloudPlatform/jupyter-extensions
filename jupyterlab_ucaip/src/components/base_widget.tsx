import { ReactWidget } from '@jupyterlab/apputils';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { COLORS } from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { AppContext, Context } from '../context';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: COLORS.blue,
    },
    secondary: {
      main: '#747474',
    },
  },
});

export abstract class BaseWidget extends ReactWidget {
  constructor(protected context: Context) {
    super();
  }

  render() {
    return (
      <ThemeProvider theme={theme}>
        <AppContext.Provider value={this.context}>
          {this.body()}
        </AppContext.Provider>
      </ThemeProvider>
    );
  }

  abstract body(): React.ReactNode;
}
