jest.mock('../store/view', () => ({
  setView: jest.fn(),
}));
jest.mock('../store/studies', () => ({
  deleteStudy: jest.fn(),
}));
jest.mock('../service/optimizer', () => ({
  prettifyStudyName: name => name,
}));
import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { fakeStudy } from '../service/test-constants';
import MaterialTable from 'material-table';
import { DashboardUnwrapped } from './dashboard';
import { Button } from '@material-ui/core';

describe('Dashboard', () => {
  let component: ShallowWrapper<any, any, React.Component<{}, {}, any>>;
  let openCreateStudy: jest.Mock;
  let openStudyDetails: jest.Mock;
  let deleteStudy: jest.Mock;

  const dashboardData = {
    loading: false,
    error: undefined,
    studies: [fakeStudy, fakeStudy, fakeStudy],
  };
  beforeEach(() => {
    openCreateStudy = jest.fn();
    openStudyDetails = jest.fn();
    deleteStudy = jest.fn();
    component = shallow(
      <DashboardUnwrapped
        {...dashboardData}
        openCreateStudy={openCreateStudy}
        openStudyDetails={openStudyDetails}
        deleteStudy={deleteStudy}
      />
    );
  });

  describe('table', () => {
    let table: ShallowWrapper<any, any, React.Component<{}, {}, any>>;
    beforeEach(() => {
      table = component.find(MaterialTable);
    });

    it('renders studies as rows', () => {
      expect(table.prop('data')).toEqual(dashboardData.studies);
    });
    it('has columns', () => {
      // todo: test render and sort for createtime
      expect(table.prop('columns')).toMatchInlineSnapshot(`
              Array [
                Object {
                  "field": "name",
                  "render": [Function],
                  "title": "Name",
                },
                Object {
                  "field": "state",
                  "title": "State",
                },
                Object {
                  "customSort": [Function],
                  "field": "createTime",
                  "render": [Function],
                  "title": "Date Created",
                },
              ]
          `);
    });
    it('opens the study details page', () => {
      const openStudy = table
        .prop('actions')
        .find(action => action.tooltip === 'Open Study');
      expect(openStudy).toMatchInlineSnapshot(`
        Object {
          "icon": [Function],
          "onClick": [Function],
          "tooltip": "Open Study",
        }
      `);

      openStudy.onClick(undefined, fakeStudy);
      expect(openStudyDetails).toHaveBeenCalledWith(fakeStudy.name);
    });
    it('deletes a study', () => {
      const { onRowDelete } = table.prop('editable');
      onRowDelete(fakeStudy);
      expect(deleteStudy).toHaveBeenCalledWith(fakeStudy.name);
    });
  });

  it('opens the create study page', () => {
    const button = component.find(Button);
    button.simulate('click');

    expect(button.text()).toMatchInlineSnapshot(`"Create Study"`);
    expect(openCreateStudy).toHaveBeenCalled();
  });
});
