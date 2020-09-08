//@ts-nocheck

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
import { shallow, ShallowWrapper, mount } from 'enzyme';
import React from 'react';
import {
  render,
  fireEvent,
  waitForElement,
  RenderResult,
} from '@testing-library/react';
import TestRenderer from '@types/react-test-renderer';
import {
  QueryEditorTab,
  QueryEditorTabProps,
  QueryEditorTabState,
} from './query_editor_tab';
import toJson from 'enzyme-to-json';
import { QueryTextEditor } from '../query_text_editor/query_text_editor';
import { QueryResults } from '../query_text_editor/query_editor_results';
import { QueryEditorState } from '../../../reducers/queryEditorTabSlice';

describe('Query editor tab', () => {
  let wrapper: ShallowWrapper<
    QueryEditorTabProps,
    QueryEditorTabState,
    QueryEditorTab
  >;
  let props: any;
  let store: any;
  let state: { queryEditorTab: QueryEditorState };

  const mockStore = configureMockStore();

  const iniProps = {
    isVisible: true,
    queryId: '123123',
    iniQuery: 'I am a query',
  };

  // beforeEach(() => {

  // });
  it('empty query', () => {
    state = {
      queryEditorTab: { queries: [] },
    };

    store = mockStore(() => state);

    props = Object.assign({}, iniProps);

    wrapper = mount(
      <Provider store={store}>
        <QueryEditorTab {...props} />
      </Provider>
    );

    expect(wrapper.find(QueryTextEditor).exists()).toBeTruthy();
    expect(wrapper.find(QueryResults).exists()).toBeFalsy();
  });
  it('some query', async () => {
    state = {
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

    wrapper = mount(
      <Provider store={store}>
        <QueryEditorTab {...props} />
      </Provider>
    );

    expect(wrapper.find(QueryTextEditor).exists()).toBeTruthy();
    expect(wrapper.find(QueryResults).exists()).toBeTruthy();
  });
});
