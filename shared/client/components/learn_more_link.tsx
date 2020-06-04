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
import * as csstips from 'csstips';
import { Launch } from '@material-ui/icons';
import { withStyles } from '@material-ui/core';
import { classes, stylesheet } from 'typestyle';

import { css } from '../styles';

interface Props {
  href: string;
  text?: string;
}

const localStyles = stylesheet({
  link: {
    alignItems: 'center',
    display: 'inline-flex',
    flexDirection: 'row',
    ...csstips.padding(0, '2px'),
  },
  icon: {
    paddingLeft: '2px',
  },
});

// tslint:disable-next-line:enforce-name-casing
const SmallLaunchIcon = withStyles({
  root: {
    fontSize: '16px',
    paddingLeft: '2px',
  },
})(Launch);

/** Functional Component for an external link */
// tslint:disable-next-line:enforce-name-casing
export function LearnMoreLink(props: Props) {
  return (
    <a
      className={classes(css.link, localStyles.link)}
      href={props.href}
      target="_blank"
    >
      <span>{props.text || 'Learn More'}</span>
      <SmallLaunchIcon />
    </a>
  );
}
