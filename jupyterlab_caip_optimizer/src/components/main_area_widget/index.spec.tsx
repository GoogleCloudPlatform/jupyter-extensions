const MockViewManager = () => <>Mock View Manager</>;

jest.mock('react-redux', () => ({
  connect: (mapStateToProps: any) => (component: any) => MockViewManager,
  Provider: ({ store, children }: any) => children,
}));
jest.mock('../../store/view');
jest.mock('../dashboard', () => ({
  Dashboard: () => <div>Dashboard Component</div>,
}));
jest.mock('../suggest_trials', () => ({
  SuggestTrials: () => <div>Suggest Trials Component</div>,
}));
jest.mock('../create_study', () => ({
  CreateStudy: () => <div>Create Study Component</div>,
}));
jest.mock('../study_details', () => ({
  StudyDetails: () => <div>Study Details Component</div>,
}));
import * as React from 'react';
import { shallow, mount } from 'enzyme';
import { close as reduxClose } from '../../store/view';
import { ViewManager, MainAreaWidget } from '../main_area_widget';

describe('ViewManager', () => {
  it('renders dashboard page', () => {
    const viewManager = shallow(<ViewManager data={{ view: 'dashboard' }} />);
    expect(viewManager).toMatchInlineSnapshot(`<Dashboard />`);
  });
  it('renders the create study page', () => {
    const viewManager = shallow(<ViewManager data={{ view: 'createStudy' }} />);
    expect(viewManager).toMatchInlineSnapshot(`<CreateStudy />`);
  });
  it('renders the study details page', () => {
    const viewManager = shallow(
      <ViewManager data={{ view: 'studyDetails', studyId: 'STUDY-ID' }} />
    );
    expect(viewManager).toMatchInlineSnapshot(`
    <StudyDetails
      studyId="STUDY-ID"
    />
    `);
  });
  it('renders the suggest trials page', () => {
    const viewManager = shallow(
      <ViewManager
        data={{ view: 'suggestTrials', studyId: 'studyToSuggest' }}
      />
    );
    expect(viewManager).toMatchInlineSnapshot(`
      <SuggestTrials
        studyName="studyToSuggest"
      />
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
