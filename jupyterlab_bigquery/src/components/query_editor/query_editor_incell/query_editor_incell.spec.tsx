import { shallow } from 'enzyme';
import React from 'react';
import {
  QueryEditorInCell,
  QueryEditorInCellProps,
} from './query_editor_incell';
import QueryTextEditor from '../query_text_editor/query_text_editor';
import QueryResults from '../query_text_editor/query_editor_results';
import MockQueryResultsManager from '../../../utils/MockQueryResultsManager';

const mockQueryResultsManager = new MockQueryResultsManager(0);

jest.mock('../../../utils/QueryResultsManager.ts', () => {
  return function() {
    return mockQueryResultsManager;
  };
});

describe('Query editor tab', () => {
  const fakeIpyView = {
    model: {
      get: () => {
        return JSON.stringify('');
      },
    },
  };

  it('empty query', () => {
    const props = ({
      ipyView: fakeIpyView,
      queries: {},
    } as unknown) as QueryEditorInCellProps;

    const wrapper = shallow(<QueryEditorInCell {...props} />);

    expect(wrapper.find(QueryTextEditor).exists()).toBeTruthy();
    expect(wrapper.find(QueryResults).exists()).toBeFalsy();
  });
  it('some query', () => {
    mockQueryResultsManager.slotSize = 1;
    const queryId = 'query-id';

    const props = ({
      ipyView: fakeIpyView,
      queries: {
        [queryId]: {
          contentLen: 1,
          labels: ['a'],
          bytesProcessed: 100,
          project: 'project',
          queryId: queryId,
          query: 'query',
        },
      },
    } as unknown) as QueryEditorInCellProps;

    const wrapper = shallow(<QueryEditorInCell {...props} />);

    expect(wrapper.find(QueryTextEditor).exists()).toBeTruthy();
    expect(wrapper.find(QueryResults).exists()).toBeTruthy();
  });
});
