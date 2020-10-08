import * as React from 'react';
import { WrappedSidebar, SidebarWidget } from '.';
import {
  render as noProviderRender,
  screen as noProviderScreen,
} from '@testing-library/react';
import {
  render,
  screen,
  initialState,
  reducer,
} from '../../utils/redux_render';
import userEvent from '@testing-library/user-event';
import {
  cleanFakeStudyName,
  fakeStudyName,
} from '../../service/test_constants';
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';

describe('Sidebar', () => {
  it('opens the dashboard when the button is clicked', () => {
    const { getState } = render(<WrappedSidebar />);

    userEvent.click(screen.getByText(/main dashboard/i));

    expect(getState().view).toEqual({
      data: { view: 'dashboard' },
      isVisible: true,
    });
  });
  it('opens a study details page when a study in the list is clicked on', () => {
    const { getState } = render(<WrappedSidebar />);

    // click on study row item
    userEvent.click(screen.getByText(cleanFakeStudyName, { exact: false }));

    expect(getState().view).toEqual({
      data: { view: 'studyDetails', studyId: fakeStudyName },
      isVisible: true,
    });
  });
  it('shows no study list when there are no studies and displays some text', () => {
    render(<WrappedSidebar />, {
      preloadedState: {
        ...initialState,
        studies: {
          data: [],
          loading: false,
          error: undefined,
        },
      },
    });

    expect(screen.queryAllByTestId('studyRow')).toHaveLength(0);
    expect(screen.getByText(/no studies found/i)).toBeInTheDocument();
  });

  it('does not show spinner when not loading', () => {
    render(<WrappedSidebar />);

    expect(screen.queryByTestId('loadingSpinner')).not.toBeInTheDocument();
  });

  it('shows spinner when loading', () => {
    render(<WrappedSidebar />, {
      preloadedState: {
        ...initialState,
        studies: {
          data: [],
          loading: true,
          error: undefined,
        },
      },
    });

    expect(screen.getByTestId('loadingSpinner')).toBeInTheDocument();
  });

  it('shows error message', () => {
    const errorMessage = 'Something went wrong!';
    render(<WrappedSidebar />, {
      preloadedState: {
        ...initialState,
        studies: {
          data: [],
          loading: false,
          error: errorMessage,
        },
      },
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  describe('SidebarWidget', () => {
    it('provides the store for the Sidebar', () => {
      // load with mocks in place
      const mainAreaWidget = new SidebarWidget(
        configureStore({
          reducer,
          middleware: getDefaultMiddleware(),
          devTools: false,
          preloadedState: initialState as unknown,
        })
      );

      noProviderRender(mainAreaWidget.render());

      // shows the study name
      expect(
        noProviderScreen.getByText(cleanFakeStudyName)
      ).toBeInTheDocument();
    });
  });
});
