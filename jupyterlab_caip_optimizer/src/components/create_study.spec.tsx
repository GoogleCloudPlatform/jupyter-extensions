jest.mock('../store/view', () => ({
  setView: jest.fn(),
}));
jest.mock('../store/studies', () => ({
  createStudy: jest.fn(),
}));
const MockCreateStudy = () => <>Mock CreateStudy</>;
jest.mock('react-redux', () => ({
  connect: (mapStateToProps: any) => (component: any) => MockCreateStudy,
  Provider: ({ store, children }: any) => children,
}));
import * as React from 'react';
import {
  createDropdown,
  DropdownItem,
} from './create_study';
import * as Types from '../types';

describe('Dropdown list', () => {
  it('receives readonly string array and renders as dropdown menu', () => {
    const dropdown = createDropdown(Types.GoalTypeList);
    const goalDropdownList: DropdownItem[] = [
      {
        value: 'MAXIMIZE',
        label: 'MAXIMIZE',
      },
      {
        value: 'MINIMIZE',
        label: 'MINIMIZE',
      },
      {
        value: 'GOAL_TYPE_UNSPECIFIED',
        label: 'GOAL_TYPE_UNSPECIFIED',
      },
    ];
    expect(dropdown).toEqual(goalDropdownList);
  });
});
