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
 **/
import React from 'react';
import { File, Range } from '../service/file';

interface Props {
    range: Range,
    filePath: string,
    file?: File;
}

export class CommentContext extends React.Component<Props> {

  render() {
    const context = this.props.file.getContext(this.props.range);
    if (context) {
        return <code>{context}</code>;
    } else {
        console.log("No context to display");
        return <> </>;
    }
  }
}

