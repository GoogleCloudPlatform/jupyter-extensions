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
// import { render, cleanup } from '@testing-library/react';
// import { Button } from '@material-ui/core';
import {
  // CreateStudyUnwrapped,
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
/*
describe('Create Study page', () => {
  const setStateMock = jest.fn();
  const useStateMock: any = (initState: any) => [initState, setStateMock];
  afterEach(cleanup);

  it('renders', () => {
    jest.spyOn(React, 'useState').mockImplementation(useStateMock);
    const mockCreateStudyAndLoad = jest.fn();
    const { getByText } = render(
      <CreateStudyUnwrapped createStudyAndLoad={mockCreateStudyAndLoad} />
    );
    const CreateStudyButton = getByText('Create Study');
    expect(CreateStudyButton).toHaveProperty('disabled');
  });

  // let useState;
  // const mockCreateStudyAndLoad = jest.fn();
  // let component;

  // const mockUseState = () => {
  //   useState.mockImplementationOnce(f => f());
  // };
  // beforeEach(() => {
  //   useState = jest.spyOn(React, 'useState');
  //   mockUseState();
  //   component = shallow(
  //     <CreateStudyUnwrapped createStudyAndLoad={mockCreateStudyAndLoad} />
  //   );
  // });
  // it('initially has Create Study button inactive', () => {
  //   const button = component.findWhere(
  //     node => node.type() === Button && node.text().includes('Create Study')
  //   );
  //   expect(button.prop('disabled')).toEqual(false);
  // });
});*/
