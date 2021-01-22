import * as React from 'react';
import { classes, stylesheet } from 'typestyle';
import { withStyles } from '@material-ui/core/styles';
import FormHelperText from '@material-ui/core/FormHelperText';
import {
  INPUT_TEXT_STYLE,
  FORM_LABEL_STYLE,
  ALIGN_HINT,
  COLORS,
} from '../styles';
import TextField from '@material-ui/core/TextField';
import { LearnMoreLink } from './learn_more_link';
import { FieldError } from './field_error';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  disabled?: boolean;
  type?: string;
  min?: string;
  max?: string;
  step?: number;
  label?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  hasError?: boolean;
  error?: string;
  formHelperText?: string;
  formHelperLink?: string;
  formHelperLinkText?: string;
}
export const TEXT_STYLES = stylesheet({
  text: {
    display: 'block',
    marginTop: '8px',
    marginBottom: '16px',
  },
});

export const CustomColorTextField = withStyles({
  root: {
    '& .MuiOutlinedInput-underline:after': {
      borderBottomColor: COLORS.focus,
    },
    '& .MuiOutlinedInput-root': {
      '&:hover fieldset': {
        borderColor: COLORS.focus,
      },
      '&.Mui-focused fieldset': {
        borderColor: COLORS.focus,
      },
    },
  },
})(TextField);

/** Funtional Component for text input fields */
// tslint:disable-next-line:enforce-name-casing
export function TextInput(props: TextInputProps) {
  const {
    label,
    hasError,
    formHelperText,
    formHelperLink,
    formHelperLinkText,
    error,
    ...inputProps
  } = props;

  return (
    <div className={TEXT_STYLES.text}>
      <CustomColorTextField
        className={classes(hasError && 'error')}
        variant="outlined"
        margin="dense"
        fullWidth={true}
        label={label}
        inputProps={{
          style: INPUT_TEXT_STYLE,
          ...inputProps,
        }}
        InputProps={{
          style: INPUT_TEXT_STYLE,
        }}
        InputLabelProps={{ shrink: true, style: { ...FORM_LABEL_STYLE } }}
      ></CustomColorTextField>
      {formHelperText && !hasError && (
        <FormHelperText style={ALIGN_HINT}>
          {formHelperText}
          {formHelperLink && (
            <LearnMoreLink text={formHelperLinkText} href={formHelperLink} />
          )}
        </FormHelperText>
      )}
      {hasError && <FieldError message={error} />}
    </div>
  );
          }