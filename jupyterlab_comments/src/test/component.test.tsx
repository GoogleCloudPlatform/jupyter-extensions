import React from 'react';
import { shallow, mount } from 'enzyme';

import { Comment } from '../components/comment';
import { NewReplyComment } from '../components/reply_editor';
// import { ReplyEditor } from '../components/reply_editor';
import { NewCommentThread } from '../components/start_thread';

const getComment = () => {
  const comment = {
    author: 'mkalil',
    text: 'fake comment for testing React component',
    timestamp: '2020',
    range: 'none',
    hash: 'none',
    filePath: 'fake/path',
  };
  return comment;
};

describe('Basic Comment Component Rendering', () => {
  it('detached comment should render correctly', () => {
    const fakeDetachedComment = getComment();
    const componentDetached = shallow(
      <Comment detachedComment={fakeDetachedComment} />
    );

    expect(componentDetached).toMatchSnapshot();
  });

  it('review comment should render correctly', () => {
    const fakeReviewComment = {
      author: 'mkalil',
      text: 'fake comment for testing React component',
      timestamp: '2020',
      range: 'none',
      hash: 'none',
      revision: 'none',
      request: {
        timestamp: '2020',
        reviewRef: 'none',
        targetRef: 'none',
        requester: 'none',
        description: 'none',
        baseCommit: 'none',
        reviewHash: 'none',
      },
      filePath: 'fake/path',
    };
    const componentReview = shallow(
      <Comment reviewComment={fakeReviewComment} />
    );

    expect(componentReview).toMatchSnapshot();
  });
});

describe('Comment Component Expand Threads Button', () => {
  it("has no children comments, don't render thread button", () => {
    const detachedWithoutChildren = getComment();
    const withoutChildren = shallow(
      <Comment detachedComment={detachedWithoutChildren} />
    );
    expect(withoutChildren.find('.thread')).toHaveLength(0);
  });

  it('has children comments, render thread button', () => {
    const detachedWithChildren = {
      author: 'mkalil',
      text: 'fake comment for testing React component',
      timestamp: '2020',
      range: 'none',
      hash: 'none',
      filePath: 'fake/path',
      children: ['fake', 'children', 'list'],
    };
    const withChildren = shallow(
      <Comment detachedComment={detachedWithChildren} />
    );
    const threadButton = withChildren.find('.threadButton');
    expect(threadButton).not.toHaveLength(0);
    expect(threadButton.text().trim()).toEqual('Show thread');
  });

  const detachedWithSingleChild = {
    author: 'mkalil',
    text: 'fake comment for testing React component',
    timestamp: '1543622400',
    range: 'none',
    hash: 'none',
    filePath: 'fake/path',
    children: [
      {
        comment: {
          author: 'test',
          text: 'test',
          timestamp: '1543622400',
          location: {
            range: '0',
          },
        },
        hash: 'rlskjdfo3iruwflkj',
      },
    ],
  };

  const detachedWithTwoChildren = {
    author: 'mkalil',
    text: 'fake comment for testing React component',
    timestamp: '1543622400',
    range: 'none',
    hash: 'none',
    filePath: 'fake/path',
    children: [
      {
        comment: {
          author: 'test',
          text: 'test',
          timestamp: '1543622400',
          location: {
            range: '0',
          },
        },
        hash: 'rlskjdfo3iruwflkj',
      },
      {
        comment: {
          author: 'test',
          text: 'test',
          timestamp: '1543622400',
          location: {
            range: '0',
          },
        },
        hash: 'rlskjdfo3iruwflkj',
      },
    ],
  };
  it('should toggle the comment component state when clicked', () => {
    const withChildren = shallow(
      <Comment detachedComment={detachedWithSingleChild} />
    );
    const threadButton = withChildren.find('.threadButton');
    expect(withChildren.state('expandThread')).toEqual(false);
    threadButton.simulate('click');
    expect(withChildren.state('expandThread')).toEqual(true);
    threadButton.simulate('click');
    expect(withChildren.state('expandThread')).toEqual(false);
  });

  it('should have a single child comment component', () => {
    const withChildren = shallow(
      <Comment detachedComment={detachedWithSingleChild} />
    );
    const threadButton = withChildren.find('.threadButton');
    threadButton.simulate('click');
    const threadList = withChildren.find('.threadList');
    expect(threadList.find('Comment')).toHaveLength(1);
  });

  it('should have two child comment components', () => {
    const withChildren = shallow(
      <Comment detachedComment={detachedWithTwoChildren} />
    );
    const threadButton = withChildren.find('.threadButton');
    threadButton.simulate('click');
    const threadList = withChildren.find('.threadList');
    expect(threadList.find('Comment')).toHaveLength(2);
  });
});

describe('Comment editor components should render correctly', () => {
  it('should render new comment thread editor', () => {
    const newThreadEditor = shallow(
      <NewCommentThread
        serverRoot="fake/path"
        currFilePath="fake/path"
        commentType="detached"
      />
    );
    expect(newThreadEditor).toMatchSnapshot();
  });

  it('should render new reply comment editor', () => {
    const replyEditor = shallow(
      <NewReplyComment
        currFilePath="fake/path"
        hash="hash"
        commentType="detached"
      />
    );
    expect(replyEditor).toMatchSnapshot();
  });
});

describe('Reply button behavior', () => {
  const comment = getComment();
  it('should show comment editor when clicked', () => {
    const component = shallow(<Comment detachedComment={comment} />);
    const replyButton = component.find('.replyButton');
    replyButton.simulate('click');
    const replyEditor = component.find('NewReplyComment');
    expect(replyEditor).toHaveLength(1);
  });

  it('should toggle component state when clicked', () => {
    const component = shallow(<Comment detachedComment={comment} />);
    const replyButton = component.find('.replyButton');
    expect(component.state('showCommentEditor')).toEqual(false);
    replyButton.simulate('click');
    expect(component.state('showCommentEditor')).toEqual(true);
  });
});

describe('Behavior for comment input field', () => {
  it('should display send button for new thread editor', () => {
    const component = mount(
      <NewCommentThread
        serverRoot="root"
        currFilePath="path"
        commentType="review"
      />
    );
    const submit = component.find('.sendThread');
    expect(submit).not.toHaveLength(0);
  });

  it('should display send button for reply editor', () => {
    const component = mount(
      <NewReplyComment hash="hash" currFilePath="path" commentType="detached" />
    );
    const submit = component.find('.sendReply');
    expect(submit).not.toHaveLength(0);
  });

  it('should store the value of the comment (reply)', () => {
    const component = mount(
      <NewReplyComment hash="hash" currFilePath="path" commentType="detached" />
    );
    const input = component.find('.replyCommentTextField').first();
    expect(input.props().value).toEqual('');
    input.props().value = 'new comment';
    expect(input.props().value).toEqual('new comment');
    const submit = component.find('.commentSubmit');
    expect(typeof submit.props().onSubmit === 'function').toBe(true);
  });

  it('should store the value of the comment (new thread)', () => {
    const component = mount(
      <NewCommentThread
        serverRoot="root"
        currFilePath="path"
        commentType="review"
      />
    );
    const input = component.find('.newThreadTextField').first();
    input.props().value = 'new comment';
    expect(input.props().value).toEqual('new comment');
    const submit = component.find('.commentSubmit');
    expect(typeof submit.props().onSubmit === 'function').toBe(true);
  });
});
