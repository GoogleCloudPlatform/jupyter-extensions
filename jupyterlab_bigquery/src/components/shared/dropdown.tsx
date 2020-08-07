import React from 'react';
import {
  Button,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  MenuList,
  MenuItem,
  ButtonProps,
} from '@material-ui/core';

interface DropDownProps {
  items: { label: string; onClick: () => void }[];
  label: string;
  buttonArgs?: ButtonProps;
}

interface DropDownState {
  open: boolean;
}

class DropDown extends React.Component<DropDownProps, DropDownState> {
  anchorRef = React.createRef<HTMLButtonElement>();

  constructor(props) {
    super(props);

    this.state = { open: false };
  }

  handleToggle = () => {
    this.setState({ open: !this.state.open });
  };

  handleClose = (event: React.MouseEvent<EventTarget>) => {
    if (
      this.anchorRef.current &&
      this.anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    this.setState({ open: false });
  };

  render() {
    const { buttonArgs } = this.props;

    return (
      <div style={{ display: 'flex' }}>
        <div>
          <Button
            ref={this.anchorRef}
            aria-controls={this.state.open ? 'menu-list-grow' : undefined}
            aria-haspopup="true"
            onClick={this.handleToggle.bind(this)}
            {...buttonArgs}
          >
            {this.props.label}
          </Button>
          <Popper
            open={this.state.open}
            anchorEl={this.anchorRef.current}
            role={undefined}
            transition
            disablePortal
          >
            {({ TransitionProps, placement }) => (
              <Grow
                {...TransitionProps}
                style={{
                  transformOrigin:
                    placement === 'bottom' ? 'center top' : 'center bottom',
                }}
              >
                <Paper>
                  <ClickAwayListener onClickAway={this.handleClose.bind(this)}>
                    <MenuList
                      autoFocusItem={this.state.open}
                      id="menu-list-grow"
                    >
                      {this.props.items.map((item, index) => (
                        <MenuItem
                          onClick={evt => {
                            this.handleClose(evt);
                            item.onClick();
                          }}
                          key={`dropdown-${index}`}
                        >
                          {item.label}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </ClickAwayListener>
                </Paper>
              </Grow>
            )}
          </Popper>
        </div>
      </div>
    );
  }
}

export default DropDown;
