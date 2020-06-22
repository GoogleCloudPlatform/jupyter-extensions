import { Menu, MenuItem, Portal, withStyles } from '@material-ui/core';
import React from 'react';

const ContextMenuItem = withStyles({
  root: {
    fontSize: 'var(--jp-ui-font-size1)',
  },
})(MenuItem);

const ContextMenuContainer = withStyles({
  paper: {
    border: '1px solid var(--jp-border-color0)',
    borderRadius: 0,
  },
  list: {
    padding: 0,
  },
})(Menu);

export interface MenuOption {
  label: string;
  onClick: () => void;
}

interface Props {
  items: MenuOption[];
}

interface State {
  isOpen: boolean;
  mouseX: number;
  mouseY: number;
}

export class ContextMenu extends React.PureComponent<Props, State> {
  private myRef;
  constructor(props) {
    super(props);
    this.openContextMenu = this.openContextMenu.bind(this);
    this.closeContextMenu = this.closeContextMenu.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.onClick = this.onClick.bind(this);
    this.state = {
      isOpen: false,
      mouseX: 0,
      mouseY: 0,
    };
    this.myRef = React.createRef();
  }

  private onContextMenu = event => {
    if (this.state.isOpen === true) {
      if (
        !(
          event.clientX === this.state.mouseX &&
          event.clientY === this.state.mouseY
        ) &&
        !this.myRef.current.contains(event.target as Node)
      ) {
        this.closeContextMenu();
      }
      event.preventDefault();
    }
  };

  private onClick = event => {
    event.preventDefault();
    this.closeContextMenu();
  };

  componentDidMount() {
    document.addEventListener('contextmenu', this.onContextMenu);
    document.addEventListener('click', this.onClick);
  }

  componentWillUnmount() {
    document.removeEventListener('contextmenu', this.onContextMenu);
    document.removeEventListener('click', this.onClick);
  }

  openContextMenu(event: React.MouseEvent<HTMLElement, MouseEvent>) {
    event.preventDefault();
    this.setState({
      isOpen: true,
      mouseX: event.clientX,
      mouseY: event.clientY,
    });
  }

  closeContextMenu() {
    this.setState({ isOpen: false });
  }

  render() {
    const children = React.Children.map(
      this.props.children,
      (child: React.ReactElement) => {
        return React.cloneElement(child, {
          onContextMenu: this.openContextMenu,
        });
      }
    );

    return (
      <>
        {children}
        <Portal>
          <ContextMenuContainer
            transitionDuration={0}
            open={this.state.isOpen}
            anchorReference="anchorPosition"
            anchorPosition={{ top: this.state.mouseY, left: this.state.mouseX }}
          >
            <div ref={this.myRef}>
              {this.props.items.map(option => (
                <ContextMenuItem key={option.label} onClick={option.onClick}>
                  {option.label}
                </ContextMenuItem>
              ))}
            </div>
          </ContextMenuContainer>
        </Portal>
      </>
    );
  }
}
