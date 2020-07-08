import * as React from 'react';
import { SnackbarUnwrapped } from './snackbar_widget';
import { createMount } from '@material-ui/core/test-utils';
import { Alert } from '@material-ui/lab';

describe('Snackbar', () => {
  let mount: ReturnType<typeof createMount>;
  let close: jest.Mock;

  beforeAll(() => {
    mount = createMount();
  });
  beforeEach(() => {
    close = jest.fn();
  });
  afterAll(() => {
    mount.cleanUp();
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

    expect(snackbar.find(Alert).text()).toEqual(message);
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

    expect(snackbar.find(Alert).prop('severity')).toEqual(severity);
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

    const onClose = snackbar.find(Alert).prop('onClose');
    onClose(undefined);

    expect(close).toHaveBeenCalled();
  });
});
