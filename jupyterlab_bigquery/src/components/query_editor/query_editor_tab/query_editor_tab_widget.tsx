/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http=//www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from 'react';
import { ICONS } from '../../../constants';
import { ReduxReactWidget } from '../../../utils/widgetManager/redux_react_widget';
import QueryEditorTab from './query_editor_tab';

export class QueryEditorTabWidget extends ReduxReactWidget {
  id = 'query-editor-tab';

  constructor(
    private editorNumber: number,
    private queryId: string,
    private iniQuery: string,
    private useLegacySql?: boolean
  ) {
    super();
    this.title.label = `Query Editor ${this.editorNumber}`;
    this.title.iconClass = `jp-Icon jp-Icon-20 ${ICONS.bigQuery}`;
    this.title.closable = true;
  }

  renderReact() {
    return (
      <QueryEditorTab
        isVisible={this.isVisible}
        queryId={this.queryId}
        iniQuery={this.iniQuery}
        useLegacySql={this.useLegacySql ?? false}
      />
    );
  }
}
