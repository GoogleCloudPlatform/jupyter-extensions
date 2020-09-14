// @ts-nocheck
const slotSize = 0;

jest.mock('../../../utils/QueryResultsManager.ts', () => {
  return function() {
    return {
      getSlotSize: () => {
        return slotSize;
      },
      getSlot: () => {
        return [];
      },
      resetSlot: () => undefined,
    };
  };
});

import { shallow } from 'enzyme';
import React from 'react';

import {
  QueryTextEditor,
  QueryTextEditorProps,
  styleSheet,
  QueryStates,
} from './query_text_editor';

describe('Query editor tab', () => {
  it('regular state', () => {
    const updateQueryResult = jest.fn();
    const resetQueryResult = jest.fn();
    const deleteQueryEntry = jest.fn();
    const openSnackbar = jest.fn();
    const queryId = 'query-id';

    const props = ({
      updateQueryResult,
      resetQueryResult,
      deleteQueryEntry,
      queryId: queryId,
      snackbar: undefined,
      openSnackbar,
    } as unknown) as QueryTextEditorProps;

    const wrapper = shallow(<QueryTextEditor {...props} />);

    expect(wrapper.find('.' + styleSheet.queryButton).exists()).toBeTruthy();
    expect(wrapper.find('.cancel-button').exists()).toBeFalsy();
    expect(wrapper.find('.copy-button').exists()).toBeTruthy();
  });
  it('pending query', () => {
    const updateQueryResult = jest.fn();
    const resetQueryResult = jest.fn();
    const deleteQueryEntry = jest.fn();
    const openSnackbar = jest.fn();
    const queryId = 'query-id';

    const props = ({
      updateQueryResult,
      resetQueryResult,
      deleteQueryEntry,
      queryId: queryId,
      snackbar: undefined,
      openSnackbar,
    } as unknown) as QueryTextEditorProps;

    const wrapper = shallow(<QueryTextEditor {...props} />);
    wrapper.setState({
      queryState: QueryStates.PENDING,
    });

    expect(wrapper.find('.' + styleSheet.queryButton).exists()).toBeTruthy();
    expect(wrapper.find('.cancel-button').exists()).toBeTruthy();
  });
  it('click query button', () => {
    const updateQueryResult = jest.fn();
    const resetQueryResult = jest.fn();
    const deleteQueryEntry = jest.fn();
    const openSnackbar = jest.fn();
    const queryId = 'query-id';

    const props = ({
      updateQueryResult,
      resetQueryResult,
      deleteQueryEntry,
      queryId: queryId,
      snackbar: undefined,
      openSnackbar,
    } as unknown) as QueryTextEditorProps;

    const wrapper = shallow(<QueryTextEditor {...props} />);

    const instance = wrapper.instance();
    const editor = {
      getValue: () => {
        'fake_query';
      },
      onKeyUp: jest.fn(),
      layout: jest.fn(),
    };
    instance.handleEditorDidMount(undefined, editor);
    wrapper.find('.' + styleSheet.queryButton).simulate('click');

    expect(wrapper.find('.' + styleSheet.queryButton).exists()).toBeTruthy();
    expect(wrapper.find('.cancel-button').exists()).toBeTruthy();
  });
  it('incell check open in tab button exists', () => {
    const updateQueryResult = jest.fn();
    const resetQueryResult = jest.fn();
    const deleteQueryEntry = jest.fn();
    const openSnackbar = jest.fn();
    const queryId = 'query-id';

    const props = ({
      updateQueryResult,
      resetQueryResult,
      deleteQueryEntry,
      queryId: queryId,
      snackbar: undefined,
      openSnackbar,
      editorType: 'IN_CELL',
    } as unknown) as QueryTextEditorProps;

    const wrapper = shallow(<QueryTextEditor {...props} />);

    expect(wrapper.find('.open-tab-editor').exists()).toBeTruthy();
  });
  it('incell check open in tab button does not exist', () => {
    const updateQueryResult = jest.fn();
    const resetQueryResult = jest.fn();
    const deleteQueryEntry = jest.fn();
    const openSnackbar = jest.fn();
    const queryId = 'query-id';

    const props = ({
      updateQueryResult,
      resetQueryResult,
      deleteQueryEntry,
      queryId: queryId,
      snackbar: undefined,
      openSnackbar,
      editorType: 'FULL_WINDOW',
    } as unknown) as QueryTextEditorProps;

    const wrapper = shallow(<QueryTextEditor {...props} />);

    expect(wrapper.find('.open-tab-editor').exists()).toBeFalsy();
  });
  it('check size message', () => {
    const updateQueryResult = jest.fn();
    const resetQueryResult = jest.fn();
    const deleteQueryEntry = jest.fn();
    const openSnackbar = jest.fn();
    const queryId = 'query-id';

    const props = ({
      updateQueryResult,
      resetQueryResult,
      deleteQueryEntry,
      queryId: queryId,
      snackbar: undefined,
      openSnackbar,
    } as unknown) as QueryTextEditorProps;

    const wrapper = shallow(<QueryTextEditor {...props} />);
    wrapper.setState({
      bytesProcessed: undefined,
      message: 'dummy error message',
      ifMsgErr: true,
    });

    expect(wrapper.find('.err-msg').exists()).toBeTruthy();
    expect(wrapper.find('.size-msg').exists()).toBeFalsy();
  });
  it('check size message', () => {
    const updateQueryResult = jest.fn();
    const resetQueryResult = jest.fn();
    const deleteQueryEntry = jest.fn();
    const openSnackbar = jest.fn();
    const queryId = 'query-id';

    const props = ({
      updateQueryResult,
      resetQueryResult,
      deleteQueryEntry,
      queryId: queryId,
      snackbar: undefined,
      openSnackbar,
    } as unknown) as QueryTextEditorProps;

    const wrapper = shallow(<QueryTextEditor {...props} />);
    wrapper.setState({
      bytesProcessed: 1,
      message: undefined,
      ifMsgErr: false,
    });

    expect(wrapper.find('.err-msg').exists()).toBeFalsy();
    expect(wrapper.find('.size-msg').exists()).toBeTruthy();
  });
});
