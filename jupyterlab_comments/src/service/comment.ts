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

import { timeAgo } from './timestamp';

export type DetachedComment = Comment;

export interface CodeReviewComment extends Comment {
  request: ReviewRequest;
  revision: any;
}

export interface Comment {
  author: any;
  text: any;
  timestamp: string;
  range: any;
  hash: any;
  filePath: string;
  children?: any;
  parent?: any;
}

export interface ReviewRequest {
  timestamp: any;
  reviewRef: string;
  targetRef: string;
  requester: string;
  description: any;
  baseCommit: any;
}

export function createDetachedCommentFromJSON(
  obj: any,
  filePath: string
): DetachedComment {
  const content = obj.comment;
  const hash = obj.hash;
  const children = obj.children;
  const now = new Date();
  const current = now.getTime();
  const timestampString = timeAgo(current, parseInt(content.timestamp) * 1000);
  const comment: DetachedComment = {
    author: content.author,
    text: content.description,
    timestamp: timestampString,
    range: content.location.range,
    hash: hash,
    filePath: filePath,
  };
  if (children) {
    comment.children = children;
  }
  if (content.parent) {
    comment.parent = parent;
  }
  return comment;
}

export function createReviewCommentFromJSON(
  obj: any,
  revision: any,
  request: any,
  filePath: string
): CodeReviewComment {
  const content = obj.comment;
  const hash = obj.hash;
  const children = obj.children;
  const now = new Date();
  const current = now.getTime();
  const timestampString = timeAgo(current, parseInt(content.timestamp) * 1000);
  const comment: CodeReviewComment = {
    author: content.author,
    text: content.description,
    timestamp: timestampString,
    range: content.location.range,
    hash: hash,
    revision: revision,
    request: request,
    filePath: filePath,
  };
  if (children) {
    comment.children = children;
  }
  if (content.parent) {
    comment.parent = parent;
  }
  return comment;
}
