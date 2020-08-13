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
import { ActionBar, SubmitButton } from 'gcp_jupyterlab_shared';
import { stylesheet } from 'typestyle';
import { MAPPED_ATTRIBUTES, Details, STYLES } from '../data';

const DETAILS_STYLES = stylesheet({
  container: {
    padding: '0px 30px',
  },
  heading: {
    fontSize: '20px',
    padding: '20px 0px',
  },
});

interface Props {
  details: Details;
  receivedError: boolean;
  onDialogClose: () => void;
  reshapeForm: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DetailsDialogBody(props: Props) {
  const { details, receivedError, onDialogClose, reshapeForm } = props;
  return (
    <dl className={DETAILS_STYLES.container}>
      <p className={DETAILS_STYLES.heading}>Notebook VM Details</p>
      {receivedError
        ? 'Unable to retrieve GCE VM details, please check your server logs'
        : MAPPED_ATTRIBUTES.map(am => (
            <div className={STYLES.listRow} key={am.label}>
              <dt className={STYLES.dt}>{am.label}</dt>
              <dd className={STYLES.dd}>{am.mapper(details)}</dd>
            </div>
          ))}
      <ActionBar closeLabel="Close" onClick={onDialogClose}>
        <SubmitButton
          actionPending={false}
          onClick={reshapeForm}
          text="Reshape"
        />
      </ActionBar>
    </dl>
  );
}
