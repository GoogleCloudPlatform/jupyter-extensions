/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import { stylesheet } from 'typestyle';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import ChevronRightRoundedIcon from '@material-ui/icons/ChevronRightRounded';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import InputAdornment from '@material-ui/core/InputAdornment';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import { Option, MACHINE_TYPES } from '../data';

export const STYLES = stylesheet({
  itemGroup: {
    overflowY: 'auto',
    height: '240px',
    width: '233px',
  },
  menuContainer: {
    paddingTop: '8px',
    paddingBottom: '8px',
    width: '468px',
  },
});

/* Item component that the user can select on the menu */

interface ItemProps {
  option: Option;
  onSelect: (o: Option) => void;
  selected: boolean;
}

export function Item(props: ItemProps) {
  const { option, onSelect, selected } = props;

  return (
    <ListItem onClick={e => onSelect(option)} button selected={selected}>
      <ListItemText primary={option.value} secondary={option.text} />
    </ListItem>
  );
}

/* Header item component that, on hover, changes the options the user can select 
from on the menu */

interface HeaderItemProps {
  label: string;
  onHover: () => void;
}

interface HeaderItemState {
  isHovering: boolean;
}

class HeaderItem extends React.Component<HeaderItemProps, HeaderItemState> {
  constructor(props: HeaderItemProps) {
    super(props);

    this.state = {
      isHovering: false,
    };
  }

  render() {
    const { label, onHover } = this.props;

    return (
      <div onMouseEnter={() => onHover()}>
        <ListItem button>
          <ListItemText primary={label} />
          <ChevronRightRoundedIcon />
        </ListItem>
      </div>
    );
  }
}

/* Nested select body component */

interface NestedSelectBodyProps {
  onSelect: (o: Option) => void;
  selectedOption: Option;
}

interface NestedSelectBodyState {
  displayedOptions: Option[];
}

class NestedSelectBody extends React.Component<NestedSelectBodyProps, NestedSelectBodyState> {
  constructor(props: NestedSelectBodyProps) {
    super(props);

    this.state = {
      displayedOptions: MACHINE_TYPES[0].configurations,
    };
  }

  /* Displays a menu of header items that, on hover, change the options the user 
        can select on the menu */
  private headersList() {
    return (
      <div className={STYLES.itemGroup}>
        <List dense={true} disablePadding={true}>
          <HeaderItem
            key={MACHINE_TYPES[0].base.value}
            label={MACHINE_TYPES[0].base.text}
            onHover={() =>
              this.setState({
                displayedOptions: MACHINE_TYPES[0].configurations,
              })
            }
          />
          <Divider style={{ marginTop: 4, marginBottom: 4 }} />
          {MACHINE_TYPES.slice(1).map(machineType => (
            <HeaderItem
              key={machineType.base.value}
              label={machineType.base.text}
              onHover={() =>
                this.setState({ displayedOptions: machineType.configurations })
              }
            />
          ))}
        </List>
      </div>
    );
  }

  /* Displays a list of options that the user can select from */
  private optionsList() {
    const { displayedOptions } = this.state;
    const { onSelect, selectedOption } = this.props;

    return (
      <div className={STYLES.itemGroup}>
        <List dense={true} disablePadding={true}>
          {displayedOptions.map(o => (
            <Item
              key={o.value}
              option={o}
              onSelect={onSelect}
              selected={o.value === selectedOption.value}
            />
          ))}
        </List>
      </div>
    );
  }

  render() {
    return (
        <Paper elevation={5} square>
          <div className={STYLES.menuContainer}>
            <Grid container spacing={0} alignItems="center">
              <Grid item xs>
                {this.headersList}
              </Grid>
              <Divider orientation="vertical" flexItem />
              <Grid item xs>
                {this.optionsList()}
              </Grid>
            </Grid>
          </div>
        </Paper>
    );
  }
}

/* Nested select component */

interface NestedSelectProps {
  onChange?: (value: string) => void;
}

interface NestedSelectState {
  visible: boolean;
  value: Option;
}

export class NestedSelect extends React.Component<NestedSelectProps, NestedSelectState> {
  constructor(props: NestedSelectProps) {
    super(props);

    this.state = {
      visible: false,
      value: MACHINE_TYPES[0].configurations[0],
    };
  }

  private displayValue(option: Option) {
    return `${option.value} (${option.text})`;
  }

  private toggleMenuBody() {
    this.setState({ visible: !this.state.visible });
  }

  private selectOption(newValue: Option) {
    this.setState({
      value: newValue,
      visible: false,
    });

    this.props.onChange(newValue.value as string);
  }

  render() {
    const { visible, value } = this.state;

    return (
      <div>
        <OutlinedInput
          value={this.displayValue(value)}
          margin="dense"
          fullWidth={true}
          readOnly={true}
          onClick={e => this.toggleMenuBody()}
          endAdornment={
            <InputAdornment variant="outlined" position="end">
              <ArrowDropDownIcon />
            </InputAdornment>
          }
        />
        {visible && (
          <NestedSelectBody
            onSelect={newValue => this.selectOption(newValue)}
            selectedOption={value}
          />
        )}
      </div>
    );
  }
}
