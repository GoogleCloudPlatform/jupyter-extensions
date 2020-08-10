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
import { classes, stylesheet } from 'typestyle';

import { css } from '../styles';
import { Progress } from './progress';
import { RedError, BlueInfo } from './status_icons';
import { LearnMoreLink } from './learn_more_link';

interface Props {
  asError?: boolean;
  asActivity?: boolean;
  link?: string;
  linkText?: string;
  text: string;
}

const localStyles = stylesheet({
  error: {
    backgroundColor: 'var(--md-red-50, #ffebee)',
    color: 'var(--md-red-700, #d32f2f)',
  },
  info: {
    backgroundColor: 'var(--md-blue-50, #bbdefb)',
    color: 'var(--md-blue-700, #1976d2)',
  },
  message: {
    alignItems: 'center',
    borderRadius: '3px',
    padding: '7px',
  },
  text: {
    paddingLeft: '5px',
  },
});

/** Shared message component. */
export function Message(props: Props): JSX.Element {
  return (
    <div
      className={classes(
        css.row,
        localStyles.message,
        props.asError ? localStyles.error : localStyles.info
      )}
    >
      {props.asActivity ? (
        <Progress />
      ) : props.asError ? (
        <RedError />
      ) : (
        <BlueInfo />
      )}
      <span className={localStyles.text}>
        {props.text}
        {props.link && (
          <LearnMoreLink href={props.link} text={props.linkText} />
        )}
      </span>
    </div>
  );
}
