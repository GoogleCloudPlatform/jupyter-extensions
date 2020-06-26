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
import { Popper, Fade, Paper } from '@material-ui/core';
import { classes } from 'typestyle';
import { STYLES } from '../data';

interface Props {
  children: React.ReactNode;
}

const GRAPH_ICON_CLASS = 'jp-UtilizationGraphsIcon';

export function WidgetPopup(props: Props) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'widget-popper' : undefined;

  return (
    <React.Fragment>
      <span
        className={classes(
          GRAPH_ICON_CLASS,
          STYLES.icon,
          STYLES.interactiveHover
        )}
        title="Show resource utilization"
        onClick={handleClick}
      ></span>
      <Popper
        id={id}
        open={open}
        anchorEl={anchorEl}
        placement={'top-start'}
        transition
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper>{props.children}</Paper>
          </Fade>
        )}
      </Popper>
    </React.Fragment>
  );
}
