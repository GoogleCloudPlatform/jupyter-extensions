import * as React from 'react';
import {
  screen,
  render,
  waitFor,
  waitForElementToBeRemoved,
} from '../../utils/redux_render';
import {
  cleanFakeStudyName,
  fakeStudyName,
  fakeStudyNameTree,
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

  describe('Parameter Tree', () => {
    it('shows root and all child nodes', () => {
      render(<StudyDetails studyId={fakeStudyNameTree} />);

      // Root
      expect(screen.getByTestId('root')).toBeInTheDocument();

      // Categorical
      expect(screen.getByTestId('root/param-categorical')).toBeInTheDocument();
      // Categorical Children
      expect(
        screen.getByTestId('root/param-categorical/deep_learning_rate')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('root/param-categorical/learning_rate')
      ).toBeInTheDocument();

      // Discrete
      expect(screen.getByTestId('root/param-discrete')).toBeInTheDocument();
      // Discrete Children
      expect(
        screen.getByTestId('root/param-discrete/small_model')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('root/param-discrete/big_model')
      ).toBeInTheDocument();

      // Integer
      expect(screen.getByTestId('root/param-integer')).toBeInTheDocument();
      // Integer Children
      expect(screen.getByTestId('root/param-integer/low')).toBeInTheDocument();
      expect(screen.getByTestId('root/param-integer/high')).toBeInTheDocument();
    });
    it('opens a details dialog that shows name, type, and valid values, and closes', async () => {
      render(<StudyDetails studyId={fakeStudyNameTree} />);

      // Click on node
      userEvent.click(screen.getByTestId('root/param-integer/low'));

      // Wait for dialog
      await waitFor(() => screen.getByTestId('parameterDetailsDialog'));

      // See details
      expect(screen.getByTestId('parameterDetailsName')).toBeInTheDocument();
      expect(screen.getByTestId('parameterDetailsType')).toBeInTheDocument();
      expect(
        screen.getByText('min: 1, max: 10', { exact: false })
      ).toBeInTheDocument();

      // Close dialog
      userEvent.click(screen.getByText(/exit/i));

      // Wait for dialog close
      await waitForElementToBeRemoved(() =>
        screen.getByTestId('parameterDetailsDialog')
      );
    });
  });
});
