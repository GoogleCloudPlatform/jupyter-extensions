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
}
