import * as React from 'react';
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import MenuItem from "@material-ui/core/MenuItem";
import {
    Box
} from "@material-ui/core";

/**
 * Checkout: https://github.com/mui-org/material-ui/blob/master/docs/src/pages/getting-started/templates/sign-in/SignIn.js
 */

const paramTypes = [
  {
    value: "CATEGORY",
    label: "Categoasdfry"
  },
  {
    value: "INTEGER",
    label: "Integer"
  }
];

export const CreateStudy = () => {
  const [paramType, setParamType] = React.useState("");

  const handleChange = event => {
    setParamType(event.target.value);
  };
  return (
    <Box m={5}>
    <React.Fragment>
      <Typography variant="h5" gutterBottom>
        Create New Study
      </Typography>
      <Grid container spacing={3}>
        <Grid container item xs={12}>
          <TextField
            required
            id="studyName"
            name="studyName"
            label="Study Name"
            fullWidth
            // autoComplete="given-name"
          />
        </Grid>
        <Grid container item spacing={1} xs={12} md={6}>
          <Typography align="center" variant="h6" gutterBottom>
            Parameter Configuration
          </Typography>
          <Grid item xs={12}>
            <TextField
              required
              id="paramName"
              name="paramName"
              label="Parameter Name"
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="paramType"
              select
              label="Select Parameter Type"
              value={paramType}
              onChange={handleChange}
              helperText="Some Helper Text"
              fullWidth
            >
              {paramTypes.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
        <Grid container item spacing={1} xs={12} md={6}>
          <Typography align="center" variant="h6" gutterBottom>
            Metric Configuration
          </Typography>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            id="address1"
            name="address1"
            label="Address line 1"
            fullWidth
            autoComplete="shipping address-line1"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="address2"
            name="address2"
            label="Address line 2"
            fullWidth
            autoComplete="shipping address-line2"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="city"
            name="city"
            label="City"
            fullWidth
            autoComplete="shipping address-level2"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            id="state"
            name="state"
            label="State/Province/Region"
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="zip"
            name="zip"
            label="Zip / Postal code"
            fullWidth
            autoComplete="shipping postal-code"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="country"
            name="country"
            label="Country"
            fullWidth
            autoComplete="shipping country"
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox color="secondary" name="saveAddress" value="yes" />
            }
            label="Use this address for payment details"
          />
        </Grid>
      </Grid>
    </React.Fragment>
              
    </Box>
  );
};
