const MockSidebar = () => <>Mock Sidebar</>;
jest.mock('react-redux', () => ({
  connect: (mapStateToProps: any) => (component: any) => MockSidebar,
  Provider: ({ store, children }: any) => children,
}));
jest.mock('@material-ui/core');
jest.mock('../store/view');
jest.mock('../service/optimizer', () => ({
  prettifyStudyName: name => name,
}));
import * as React from 'react';
import { mount, shallow } from 'enzyme';
import { SidebarWidget, Sidebar } from './sidebar_widget';
import {
  Button,
  TableRow,
  Table,
  CircularProgress,
  Typography,
} from '@material-ui/core';
import { fakeStudy } from '../service/test-constants';

describe('Sidebar', () => {
  let mockOpenDashboard: jest.Mock;
  let mockOpenStudy: jest.Mock;

  beforeEach(() => {
    mockOpenDashboard = jest.fn();
    mockOpenStudy = jest.fn();
  });

  it('opens the dashboard when the button is clicked', () => {
    const component = shallow(
      <Sidebar
        loading={false}
        openDashboard={mockOpenDashboard}
        openStudy={mockOpenStudy}
      />
    );

    component.find(Button).simulate('click');

    expect(mockOpenDashboard).toHaveBeenCalled();
  });
  it('opens a study details page when a study in the list is clicked on', () => {
    const component = shallow(
      <Sidebar
        loading={false}
        openDashboard={mockOpenDashboard}
        openStudy={mockOpenStudy}
        studies={[fakeStudy]}
      />
    );

    component
      .findWhere(
        node => node.type() === TableRow && node.text().includes(fakeStudy.name)
      )
      .first()
      .simulate('click');

    expect(mockOpenStudy).toHaveBeenCalledWith(fakeStudy.name);
  });
  it('shows no study list when there are no studies', () => {
    const component = shallow(
      <Sidebar
        loading={false}
        openDashboard={mockOpenDashboard}
        openStudy={mockOpenStudy}
        studies={[]}
      />
    );

    expect(component.find(Table).exists()).toBe(false);
  });

  it('does not show spinner when not loading', () => {
    const notLoadingSidebar = shallow(
      <Sidebar
        loading={false}
        openDashboard={mockOpenDashboard}
        openStudy={mockOpenStudy}
        studies={[]}
      />
    );

    expect(notLoadingSidebar.find(CircularProgress).exists()).toBe(false);
  });

  it('shows spinner when loading', () => {
    const loadingSidebar = shallow(
      <Sidebar
        loading={true}
        openDashboard={mockOpenDashboard}
        openStudy={mockOpenStudy}
        studies={[]}
      />
    );

    expect(loadingSidebar.find(CircularProgress).exists()).toBe(true);
  });

  it('shows error message', () => {
    const errorMessage = 'Something went wrong!';
    const loadingSidebar = shallow(
      <Sidebar
        loading={false}
        error={errorMessage}
        openDashboard={mockOpenDashboard}
        openStudy={mockOpenStudy}
        studies={[]}
      />
    );

    expect(
      loadingSidebar
        .findWhere(
          component =>
            component.is(Typography) && component.prop('color') === 'error'
        )
        .text()
    ).toEqual(errorMessage);
  });
});

describe('SidebarWidget', () => {
  let mockStore: any;

  beforeEach(() => {
    mockStore = {
      getState: jest.fn(),
      dispatch: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('provides the store for the Sidebar', () => {
    const mainAreaWidget = new SidebarWidget(mockStore);
    const rendered = mount(mainAreaWidget.render());

    expect(rendered.prop('store')).toBe(mockStore);
    expect(rendered).toMatchInlineSnapshot(`
      <Provider
        store={
          Object {
            "dispatch": [MockFunction],
            "getState": [MockFunction],
          }
        }
      >
        <MockSidebar>
          Mock Sidebar
        </MockSidebar>
      </Provider>
    `);
  });
});
