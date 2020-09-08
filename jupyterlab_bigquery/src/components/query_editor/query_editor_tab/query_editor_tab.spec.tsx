let slotSize = 0;

jest.mock('../../../utils/QueryResultsManager.ts', () => {
  return function() {
    return {
      getSlotSize: () => {
        return slotSize;
      },
      getSlot: () => {
        return [];
      },
    };
  };
});

import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { mount } from 'enzyme';
import React from 'react';
import { QueryEditorTab } from './query_editor_tab';
import {
  QueryTextEditor,
  QueryResult,
} from '../query_text_editor/query_text_editor';
import { QueryResults } from '../query_text_editor/query_editor_results';

describe('Query editor tab', () => {
  let props: any;
  let store: any;

  const mockStore = configureMockStore();

  const iniProps = {
    isVisible: true,
    queryId: '123123',
    iniQuery: 'I am a query',
  };

  it('empty query', () => {
    const state = {
      queryEditorTab: { queries: ([] as unknown) as QueryResult },
    };

    store = mockStore(() => state);

    props = Object.assign({}, iniProps);

    const wrapper = mount(
      <Provider store={store}>
        <QueryEditorTab {...props} />
      </Provider>
    );

    expect(wrapper.find(QueryTextEditor).exists()).toBeTruthy();
    expect(wrapper.find(QueryResults).exists()).toBeFalsy();
  });
  it('some query', async () => {
    const state = {
      queryEditorTab: {
        queries: {
          [iniProps.queryId]: {
            contentLen: 1,
            labels: ['a'],
            bytesProcessed: 100,
            project: 'project',
            queryId: iniProps.queryId,
            query: 'query',
          },
        },
      },
    };
    slotSize = 1;

    store = mockStore(() => state);

    props = Object.assign({}, iniProps);

    const wrapper = mount(
      <Provider store={store}>
        <QueryEditorTab {...props} />
      </Provider>
    );

    await store.dispatch({ type: 'ANY' });

    expect(wrapper.find(QueryTextEditor).exists()).toBeTruthy();
    expect(wrapper.find(QueryResults).exists()).toBeTruthy();
  });
});
