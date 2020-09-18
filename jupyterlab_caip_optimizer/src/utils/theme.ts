import { createMuiTheme } from '@material-ui/core/styles';

const heading = {
  fontFamily: `"Google Sans", "Roboto", "Helvetica", "Arial", sans-serif`,
  fontWeight: 500,
};

export const theme = createMuiTheme({
  typography: {
    h1: heading,
    h2: heading,
    h3: heading,
    h4: heading,
    h5: heading,
    h6: heading,
  },
});
