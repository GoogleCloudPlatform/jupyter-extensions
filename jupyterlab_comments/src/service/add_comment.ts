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

import { httpGitRequest } from '../service/request';

export async function newDetachedCommentThread(
  currFilePath,
  serverRoot,
  commentString,
  lineNumber?
) {
  const body: Record<string, string> = {
    comment: commentString,
  };
  if (lineNumber) {
    body.line = lineNumber;
  }
  httpGitRequest(
    'addDetachedComment',
    'POST',
    currFilePath,
    serverRoot,
    body
  ).then(response => {
    console.log(response);
  });
}

export async function newDetachedCommentReply(
  currFilePath,
  serverRoot,
  commentString,
  parentHash
) {
  const body: Record<string, string> = {
    comment: commentString,
    parent: parentHash,
  };
  httpGitRequest(
    'addDetachedComment',
    'POST',
    currFilePath,
    serverRoot,
    body
  ).then(response => {
    console.log(response);
  });
}

export async function newReviewCommentThread(
  currFilePath,
  serverRoot,
  commentString,
  reviewHash,
  lineNumber?
) {
  const body: Record<string, string> = {
    comment: commentString,
    reviewHash: reviewHash,
  };
  if (lineNumber) {
    body.line = lineNumber;
  }
  httpGitRequest(
    'addReviewComment',
    'POST',
    currFilePath,
    serverRoot,
    body
  ).then(response => {
    console.log(response);
  });
}

export async function newReviewCommentReply(
  currFilePath,
  serverRoot,
  commentString,
  parentHash,
  reviewHash
) {
  const body: Record<string, string> = {
    comment: commentString,
    parent: parentHash,
    reviewHash: reviewHash,
  };
  httpGitRequest(
    'addReviewComment',
    'POST',
    currFilePath,
    serverRoot,
    body
  ).then(response => {
    console.log(response);
  });
}
