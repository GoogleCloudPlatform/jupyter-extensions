jest.mock('../../store/snackbar');
jest.mock('@material-ui/core', () => ({
  Snackbar: ({ children }) => children,
}));
jest.mock('@material-ui/lab', () => ({
  Alert: ({ children }) => children,
}));
import * as React from 'react';
import { SnackbarUnwrapped } from '.';
import { mount } from 'enzyme';
import * as mui from '@material-ui/lab';

describe('Snackbar', () => {
  let close: jest.Mock;

  beforeEach(() => {
    close = jest.fn();
  });

  it('shows snackbar message with severity', () => {
    const message = 'Something went wrong!';
    const snackbar = mount(
      <SnackbarUnwrapped
        open={true}
        severity="error"
        message={message}
        close={close}
      />
    );

    expect(snackbar.find(mui.Alert).text()).toEqual(message);
  });
  it('shows severity', () => {
    const severity = 'info';
    const snackbar = mount(
      <SnackbarUnwrapped
        open={true}
        severity={severity}
        message="error"
        close={close}
      />
    );

    expect(snackbar.find(mui.Alert).prop('severity')).toEqual(severity);
  });
  it('closes the snackbar', () => {
    const snackbar = mount(
      <SnackbarUnwrapped
        open={true}
        severity="error"
        message="error"
        close={close}
      />
    );

    const onClose = snackbar.find(mui.Alert).prop('onClose');
    onClose(undefined);

    expect(close).toHaveBeenCalled();
  });
});
