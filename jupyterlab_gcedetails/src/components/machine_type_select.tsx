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
import Popover from '@material-ui/core/Popover';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import { Option, TEXT_STYLE, TEXT_LABEL_STYLE } from '../data';

const STYLES = stylesheet({
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
  nestedSelect: {
    paddingTop: '8px',
    paddingBottom: '8px',
  },
  input: {
    marginTop: '4px',
  },
});

export interface NestedOptions {
  header: Option;
  options: Option[];
}

/* Item component that wraps an option the user can select on the menu */

interface ItemProps {
  option: Option;
  onSelect: (o: Option) => void;
  selected: boolean;
}

export function Item(props: ItemProps) {
  const { option, onSelect, selected } = props;

  return (
    <ListItem onClick={e => onSelect(option)} button selected={selected}>
      <ListItemText
        primary={option.value}
        secondary={option.text}
        primaryTypographyProps={{ style: TEXT_STYLE }}
        secondaryTypographyProps={{ style: TEXT_STYLE }}
      />
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
          <ListItemText
            primary={label}
            primaryTypographyProps={{ style: TEXT_STYLE }}
          />
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
  nestedOptionsList: NestedOptions[];
}

interface NestedSelectBodyState {
  displayedOptions: Option[];
}

class NestedSelectBody extends React.Component<
  NestedSelectBodyProps,
  NestedSelectBodyState
> {
  constructor(props: NestedSelectBodyProps) {
    super(props);

    this.state = {
      displayedOptions: props.nestedOptionsList[0].options,
    };
  }

  /* Displays a menu of header items that, on hover, change the options the user 
        can select on the menu */
  private headersList() {
    const { nestedOptionsList } = this.props;

    return (
      <div className={STYLES.itemGroup}>
        <List dense={true} disablePadding={true}>
          <HeaderItem
            key={nestedOptionsList[0].header.value}
            label={nestedOptionsList[0].header.text}
            onHover={() =>
              this.setState({
                displayedOptions: nestedOptionsList[0].options,
              })
            }
          />
          <Divider style={{ marginTop: 4, marginBottom: 4 }} />
          {nestedOptionsList.slice(1).map(nestedOptions => (
            <HeaderItem
              key={nestedOptions.header.value}
              label={nestedOptions.header.text}
              onHover={() =>
                this.setState({ displayedOptions: nestedOptions.options })
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
      <Paper elevation={5}>
        <div className={STYLES.menuContainer}>
          <Grid container spacing={0} alignItems="center">
            <Grid item xs>
              {this.headersList()}
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
  nestedOptionsList: NestedOptions[];
  onChange?: (value: Option) => void;
  label?: string;
  value?: Option;
}

interface NestedSelectState {
  value: Option;
  anchorEl: null | HTMLElement;
}

export class NestedSelect extends React.Component<
  NestedSelectProps,
  NestedSelectState
> {
  constructor(props: NestedSelectProps) {
    super(props);

    this.state = {
      value: props.value ? props.value : props.nestedOptionsList[0].options[0],
      anchorEl: null,
    };
  }

  private displayValue(option: Option) {
    return `${option.value} (${option.text})`;
  }

  private handleClick(event: React.MouseEvent<HTMLElement>) {
    this.setState({
      anchorEl: this.state.anchorEl ? null : event.currentTarget,
    });
  }

  private handleClose() {
    this.setState({
      anchorEl: null,
    });
  }

  private selectOption(newValue: Option) {
    this.setState({
      value: newValue,
      anchorEl: null,
    });

    this.props.onChange(newValue);
  }

  render() {
    const { value, anchorEl } = this.state;
    const { nestedOptionsList, label } = this.props;

    const open = Boolean(anchorEl);

    return (
      <div className={STYLES.nestedSelect}>
        {/* {label && <label>{label}</label>} */}
        <TextField
          InputLabelProps={{
            style: TEXT_LABEL_STYLE,
          }}
          label={label}
          className={STYLES.input}
          value={this.displayValue(value)}
          margin="dense"
          variant="outlined"
          fullWidth={true}
          onClick={e => this.handleClick(e)}
          InputProps={{
            readOnly: true,
            style: TEXT_STYLE,
            endAdornment: (
              <InputAdornment position="end">
                <ArrowDropDownIcon />
              </InputAdornment>
            ),
          }}
        />
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={() => this.handleClose()}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <NestedSelectBody
            onSelect={newValue => this.selectOption(newValue)}
            selectedOption={value}
            nestedOptionsList={nestedOptionsList}
          />
        </Popover>
      </div>
    );
  }
}
