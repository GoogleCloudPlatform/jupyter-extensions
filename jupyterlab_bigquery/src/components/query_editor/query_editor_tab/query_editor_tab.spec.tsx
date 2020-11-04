import { shallow } from 'enzyme';
import React from 'react';
import { QueryEditorTab, QueryEditorTabProps } from './query_editor_tab';
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
  const iniProps = {
    isVisible: true,
    queryId: '123123',
    iniQuery: 'I am a query',
  };

  it('empty query', () => {
    const props = (Object.assign(
      {},
      iniProps
    ) as unknown) as QueryEditorTabProps;

    const wrapper = shallow(<QueryEditorTab {...props} />);

    expect(wrapper.find(QueryTextEditor).exists()).toBeTruthy();
    expect(wrapper.find(QueryResults).exists()).toBeFalsy();
  });
  it('some query', () => {
    mockQueryResultsManager.slotSize = 1;

    const props = (Object.assign(
      {
        [iniProps.queryId]: {
          contentLen: 1,
          labels: ['a'],
          bytesProcessed: 100,
          project: 'project',
          queryId: iniProps.queryId,
          query: 'query',
        },
      },
      iniProps
    ) as unknown) as QueryEditorTabProps;

    const wrapper = shallow(<QueryEditorTab {...props} />);

    expect(wrapper.find(QueryTextEditor).exists()).toBeTruthy();
    expect(wrapper.find(QueryResults).exists()).toBeTruthy();
  });
});
