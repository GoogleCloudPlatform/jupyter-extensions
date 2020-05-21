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

import { ServiceStatus } from '../../service/project_state';
import { css } from '../../styles';
import { LearnMoreLink } from '../shared/learn_more_link';
import { Message } from '../shared/message';
import { getIconForState } from './initializer';

interface Props {
  serviceStatuses: ServiceStatus[];
  isActivating: boolean;
  activationError?: string;
}

/** Shows GCP service statuses. */
export function ServiceStatuses(props: Props) {
  const { serviceStatuses, isActivating, activationError } = props;
  let message = '';
  if (isActivating) {
    message = 'Enabling all necessary APIs. This may take a few minutes...';
  } else if (activationError) {
    message = activationError;
  }
  return (
    <div className={css.column}>
      <p className={css.paragraph}>
        In order to schedule notebook runs, the following APIs must be enabled:
      </p>
      <div className={css.serviceStatuses}>
        {serviceStatuses.map(s => {
          return (
            <div className={css.serviceStatusItem} key={s.service.endpoint}>
              {getIconForState(s.enabled)}
              <LearnMoreLink
                href={s.service.documentation}
                text={s.service.name}
              />
            </div>
          );
        })}
      </div>
      {message && (
        <Message
          asActivity={isActivating}
          text={message}
          asError={!!activationError}
        />
      )}
    </div>
  );
}
