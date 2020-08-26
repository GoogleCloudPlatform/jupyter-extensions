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
import { stylesheet, classes } from 'typestyle';
import { STYLES } from '../data/styles';
import { MAPPED_ATTRIBUTES, Details } from '../data/data';
import { ActionBar } from './action_bar';

interface Props {
  details: Details;
  receivedError: boolean;
  onDialogClose: () => void;
  reshapeForm: () => void;
}

const DIALOG_STYLES = stylesheet({
  headingPadding: {
    paddingBottom: '15px',
  },
});

function loadingDetails(details: boolean, receivedError: boolean): boolean {
  return !(details || receivedError);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DetailsDialogBody(props: Props) {
  const { details, receivedError, onDialogClose, reshapeForm } = props;
  return (
    <dl className={STYLES.containerPadding}>
      <p className={classes(STYLES.heading, DIALOG_STYLES.headingPadding)}>
        Notebook VM Details
      </p>
      {loadingDetails(Boolean(details), receivedError) ? (
        <div className={STYLES.containerSize}>
          <p className={STYLES.paragraph}>Retrieving GCE VM details...</p>
        </div>
      ) : receivedError ? (
        <div className={STYLES.containerSize}>
          <p className={STYLES.paragraph}>
            Unable to retrieve GCE VM details, please check your server logs
          </p>
        </div>
      ) : (
        MAPPED_ATTRIBUTES.map(am => (
          <div className={STYLES.listRow} key={am.label}>
            <dt className={STYLES.dt}>{am.label}</dt>
            <dd className={STYLES.dd}>{am.mapper(details)}</dd>
          </div>
        ))
      )}
      <ActionBar
        primaryLabel="Update"
        secondaryLabel="Close"
        onPrimaryClick={reshapeForm}
        onSecondaryClick={onDialogClose}
        primaryDisabled={
          receivedError || loadingDetails(Boolean(details), receivedError)
        }
      />
    </dl>
  );
}
