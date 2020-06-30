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

export interface DetachedComment extends Comment {
    //default
}

export interface CodeReviewComment extends Comment {
    reviewDescription: any,
}

export interface Comment {
    author: any,
    text: any,
    timestamp: any,
    range: any,
    hash: any,
    children?: any;
    parent?: any,
}

export function createCommentFromJSON(obj : any) : DetachedComment {
    const content = obj.comment;
    const hash = obj.hash;
    const children = obj.children;
    let comment : DetachedComment = {
      author: content.author,
      text: content.description,
      timestamp: content.timestamp,
      range: content.location.range,
      hash: hash,
    };
    if (children) {
      comment.children = children;
    }
    if (content.parent) {
      comment.parent = parent;
    }
    return comment;
}