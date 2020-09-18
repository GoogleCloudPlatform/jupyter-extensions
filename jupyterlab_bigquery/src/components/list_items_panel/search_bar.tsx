import * as React from 'react';
import { stylesheet } from 'typestyle';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';

interface Props {
  handleKeyPress: (e) => void;
  handleClear: () => void;
  defaultText?: string;
}

const searchStyle = stylesheet({
  search: {
    display: 'flex',
    flexDirection: 'row',
    flexGrow: 1,
    borderStyle: 'solid',
    borderRadius: '1px',
    borderWidth: 'thin',
    borderColor: 'var(--jp-border-color2)',
  },
  searchIcon: {
    padding: '2px',
    color: 'var(--jp-layout-color3)',
  },
  clearIcon: {
    textTransform: 'none',
    alignSelf: 'center',
    color: 'var(--jp-layout-color3)',
    '&:hover': {
      cursor: 'pointer',
      opacity: 1,
    },
  },
  searchPlaceholder: {
    fontFamily: 'var(--jp-ui-font-family)',
    fontSize: 'var(--jp-ui-font-size1)',
    minWidth: 0,
    textOverflow: 'ellipsis',
    backgroundColor: 'transparent',
    color: 'var(--jp-ui-font-color1)',
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
      <SearchIcon className={searchStyle.searchIcon} />
      <input
        onKeyPress={e => props.handleKeyPress(e)}
        onChange={e => handleOnChange(e)}
        className={searchStyle.searchPlaceholder}
        placeholder="Search for your tables and datasets"
        value={searchKey}
        style={{ borderWidth: 0, flexGrow: 1 }}
      />
      {showClearIcon ? (
        <ClearIcon
          className={searchStyle.clearIcon}
          fontSize="small"
          onClick={() => handleClickClear()}
        />
      ) : (
        <div />
      )}
    </div>
  );
}
