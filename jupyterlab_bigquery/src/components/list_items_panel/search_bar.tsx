import * as React from 'react';
import { stylesheet } from 'typestyle';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';

interface Props {
  handleKeyPress: (e) => void;
  handleClear: () => void;
  defaultText?: string;
}

const searchStyle = stylesheet({
  search: {
    display: 'flex',
    flexDirection: 'row',
  },
  clearIcon: {
    textTransform: 'none',
    '&:hover': {
      cursor: 'pointer',
      opacity: 1,
    },
  },
});

/** Funtional Component for a common dialog interface with cancel and submit buttons. */
export function SearchBar(props: Props) {
  const [searchKey, setSearchKey] = React.useState('');
  const [showClearIcon, setShowClearIcon] = React.useState(false);

  const handleOnChange = event => {
    setSearchKey(event.target.value);
    if (event.target.value === '') {
      setShowClearIcon(false);
      props.handleClear();
    } else {
      setShowClearIcon(true);
    }
  };

  const handleClickClear = () => {
    setSearchKey('');
    setShowClearIcon(false);
    props.handleClear();
  };

  return (
    <div className={searchStyle.search}>
      <TextField
        id="standard-search"
        value={searchKey}
        placeholder={props.defaultText || 'Search...'}
        margin="normal"
        onKeyPress={e => props.handleKeyPress(e)}
        onChange={e => handleOnChange(e)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {showClearIcon ? (
                <ClearIcon
                  className={searchStyle.clearIcon}
                  fontSize="small"
                  onClick={() => handleClickClear()}
                />
              ) : (
                <div />
              )}
            </InputAdornment>
          ),
        }}
      />
    </div>
  );
}
