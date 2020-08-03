import * as React from 'react';
import { screen, render, waitFor } from '../../utils/redux_render';
import {
  cleanFakeStudyName,
  fakeStudyName,
} from '../../service/test-constants';
import { StudyDetails } from '.';
import userEvent from '@testing-library/user-event';

describe('Study Details Page', () => {
  it('shows name, objective, algorithm, state and parameters', () => {
    render(<StudyDetails studyId={fakeStudyName} />);

    // name
    expect(screen.getAllByText(cleanFakeStudyName).length).toBeGreaterThan(0);
    // object
    expect(screen.getByText(/maximize "metric-maximize"/i)).toBeInTheDocument();
    // algorithm
    expect(screen.getByText(/ALGORITHM_UNSPECIFIED/i)).toBeInTheDocument();
    // state
    expect(screen.getByText(/active/i)).toBeInTheDocument();
    // parameters
    // name
    expect(screen.getByText(/param-categorical/i)).toBeInTheDocument();
    // type
    expect(screen.getByText('CATEGORICAL')).toBeInTheDocument();
    // valid values
    expect(screen.getByText('a,b,c,categorical-type')).toBeInTheDocument();
    // TODO: other parameter types
  });
  it('opens visualizations for the study', async () => {
    const { getState } = render(<StudyDetails studyId={fakeStudyName} />);

    userEvent.click(screen.getByText(/see visualization/i));

    await waitFor(() =>
      expect(getState().view).toEqual({
        data: {
          view: 'visualizeTrials',
          studyId: fakeStudyName,
        },
        isVisible: true,
      })
    );
  });
  it('goes back to dashboard', async () => {
    const { getState } = render(<StudyDetails studyId={fakeStudyName} />);

    userEvent.click(screen.getByText(/go to dashboard/i));

    await waitFor(() =>
      expect(getState().view).toEqual({
        data: {
          view: 'dashboard',
        },
        isVisible: true,
      })
    );
  });
  it('opens the suggest trials page for the study', async () => {
    const { getState } = render(<StudyDetails studyId={fakeStudyName} />);

    userEvent.click(screen.getByText(/view trials/i));

    await waitFor(() =>
      expect(getState().view).toEqual({
        data: {
          view: 'suggestTrials',
          studyId: fakeStudyName,
        },
        isVisible: true,
      })
    );
  });
});
