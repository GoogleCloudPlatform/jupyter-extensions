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
import { SmallLaunchIcon } from './icons';
import { classes, stylesheet } from 'typestyle';

import { css, COLORS } from '../styles';

interface Props {
  secondary?: boolean;
  href: string;
  text?: string;
  noUnderline?: boolean;
  disabled?: boolean;
}

const localStyles = stylesheet({
  link: {
    color: COLORS.focus,
    alignItems: 'center',
    display: 'inline-flex',
    flexDirection: 'row',
    ...csstips.padding(0, '2px'),
    wordBreak: 'break-all',
  },
  secondary: {
    color: COLORS.base,
  },
  noUnderline: {
    textDecoration: 'none',
  },
  disabled: {
    color: COLORS.base,
    pointerEvents: 'none',
    cursor: 'default',
    opacity: '0.6',
  },
});

/** Functional Component for an external link */
// tslint:disable-next-line:enforce-name-casing
export function LearnMoreLink(props: Props) {
  return (
    <a
      className={classes(
        css.link,
        localStyles.link,
        props.noUnderline ? localStyles.noUnderline : null,
        props.secondary ? localStyles.secondary : null,
        props.disabled ? localStyles.disabled : null
      )}
      href={props.href}
      target="_blank"
    >
      <span>{props.text || 'Learn More'}</span>
      <SmallLaunchIcon />
    </a>
  );
}
