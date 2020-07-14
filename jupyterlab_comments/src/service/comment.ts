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
    request: ReviewRequest,
    revision: any,
}

export interface Comment {
    author: any,
    text: any,
    timestamp: string,
    range: any,
    hash: any,
    children?: any;
    parent?: any,
}

export interface ReviewRequest {
    timestamp: any,
    reviewRef: string,
    targetRef: string,
    requester: string,
    description: any,
    baseCommit: any,
}

export function createDetachedCommentFromJSON(obj : any) : DetachedComment {
    const content = obj.comment;
    const hash = obj.hash;
    const children = obj.children;
    var now = new Date();
    var current = now.getTime();
    var timestampString = timeAgo(current, parseInt(content.timestamp) * 1000);
    let comment : DetachedComment = {
      author: content.author,
      text: content.description,
      timestamp: timestampString,
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

export function createReviewCommentFromJSON(obj : any, revision: any, request: any) : CodeReviewComment {
    const content = obj.comment;
    const hash = obj.hash;
    const children = obj.children;
    var now = new Date();
    var current = now.getTime();
    var timestampString = timeAgo(current, parseInt(content.timestamp) * 1000);
    let comment : CodeReviewComment = {
      author: content.author,
      text: content.description,
      timestamp: timestampString,
      range: content.location.range,
      hash: hash,
      revision: revision,
      request: request,
    };
    if (children) {
      comment.children = children;
    }
    if (content.parent) {
      comment.parent = parent;
    }
    return comment;
}

function timeAgo(current, previous) {
  //Returns a new timestamp string (i.e. "20 minutes ago", "3 days ago")
    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;

    var elapsed = current - previous;
    let time : number;

    if (elapsed < msPerMinute) {
      time = Math.round(elapsed/1000);
      if (time == 1) {
        return time + ' second ago';
      } else {
        return time + ' seconds ago'
      }
    }

    else if (elapsed < msPerHour) {
      time = Math.round(elapsed/msPerMinute);
      if (time == 1) {
        return time + ' minute ago';
      } else {
        return time + ' minutes ago'
      }
    }

    else if (elapsed < msPerDay ) {
      time = Math.round(elapsed/msPerHour);
      if (time == 1) {
        return time + ' hour ago';
      } else {
        return time + ' hours ago'
      }
    }

    else if (elapsed < msPerMonth) {
      time = Math.round(elapsed/msPerDay);
      if (time == 1) {
        return time + ' day ago';
      } else {
        return time + ' days ago'
      }
    }

    else {
      return '> 1 month ago';
    }
}


