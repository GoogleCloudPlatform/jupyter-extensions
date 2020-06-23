const MockViewManager = () => <>Mock View Manager</>;

jest.mock('react-redux', () => ({
  connect: (mapStateToProps: any) => (component: any) => MockViewManager,
  Provider: ({ store, children }: any) => children,
}));
jest.mock('../store/view');
import * as React from 'react';
import { shallow, mount } from 'enzyme';
import { close as reduxClose } from '../store/view';
import { ViewManager, MainAreaWidget } from './main_area_widget';

describe('ViewManager', () => {
  it('renders dashboard page', () => {
    const viewManager = shallow(<ViewManager data={{ view: 'dashboard' }} />);
    expect(viewManager).toMatchInlineSnapshot(`
      <Fragment>
        Dashboard
      </Fragment>
    `);
  });
  it('renders the create study page', () => {
    const viewManager = shallow(<ViewManager data={{ view: 'createStudy' }} />);
    expect(viewManager).toMatchInlineSnapshot(`
      <Fragment>
        Create A Study
      </Fragment>
    `);
  });
  it('renders the study details page', () => {
    const viewManager = shallow(
      <ViewManager data={{ view: 'studyDetails', studyId: 'STUDY-ID' }} />
    );
    expect(viewManager).toMatchInlineSnapshot(`
      <Fragment>
        Study ID: 
        STUDY-ID
      </Fragment>
    `);
  });
});

describe('MainAreaWidget', () => {
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

  it('provides the store for the ViewManager', () => {
    const mainAreaWidget = new MainAreaWidget(mockStore);
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
        <MockViewManager>
          Mock View Manager
        </MockViewManager>
      </Provider>
    `);
  });
  it('triggers a redux view close when closing', () => {
    const dispose = jest.spyOn(MainAreaWidget.prototype, 'dispose');
    const mainAreaWidget = new MainAreaWidget(mockStore);

    mainAreaWidget.close();

    expect(mockStore.dispatch).toHaveBeenCalledWith(reduxClose());
    expect(dispose).toHaveBeenCalled();
  });
});
