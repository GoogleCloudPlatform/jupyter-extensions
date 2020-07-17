import React from 'react';
import { shallow } from 'enzyme';

import { Comment } from '../components/comment';
describe('Basic Comment Component Rendering', () => {
  it('detached comment should render correctly', () => {
    const fakeDetachedComment = {
      author: 'mkalil',
      text: 'fake comment for testing React component',
      timestamp: '2020',
      range: 'none',
      hash: 'none',
    };
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
      },
    };
    const componentReview = shallow(
      <Comment reviewComment={fakeReviewComment} />
    );

    expect(componentReview).toMatchSnapshot();
  });
});

describe('Comment Component Expand Threads Button', () => {
  it("has no children comments, don't render thread button", () => {
    const detachedWithoutChildren = {
      author: 'mkalil',
      text: 'fake comment for testing React component',
      timestamp: '2020',
      range: 'none',
      hash: 'none',
    };
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
