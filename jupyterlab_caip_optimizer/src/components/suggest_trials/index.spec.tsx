import * as React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  fakeStudyName,
  fakeTrial,
  fakeTrialWithFinalMeasurement,
  fakePendingSuggestOperation,
  fakeSuggestOperationGetSuccess,
  cleanFakeTrialName,
} from '../../service/test-constants';
import { SuggestTrials } from '.';
import userEvent from '@testing-library/user-event';
import {
  screen,
  render,
  waitFor,
  waitForElementToBeRemoved,
} from '../../utils/redux_render';
import {
  proxyUrl,
  getTrialsUrl,
  suggestTrialUrl,
  operationGetUrl,
  completeTrialUrl,
  deleteTrialUrl,
} from '../../utils/urls';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Suggest Trials Page', () => {
  beforeEach(() => {
    // snackbar messages
    jest.useFakeTimers();

    server.use(
      rest.get(proxyUrl(getTrialsUrl()), (req, res, ctx) => {
        return res(
          ctx.json({
            trials: [fakeTrialWithFinalMeasurement],
          })
        );
      })
    );
  });
  it('exits to study details page', async () => {
    const { getState } = render(<SuggestTrials studyName={fakeStudyName} />);

    userEvent.click(screen.getByText(/exit/i));

    await waitFor(() =>
      expect(getState().view).toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "studyId": "projects/project-id/locations/us-region/studies/study-default",
            "view": "studyDetails",
          },
          "isVisible": true,
        }
      `)
    );
  });
  describe('suggest form', () => {
    it('shows error message on input if value is less than one', () => {
      render(<SuggestTrials studyName={fakeStudyName} />);

      userEvent.type(screen.getByTestId('suggestionInput'), '{backspace}-1');

      expect(screen.getByText(/can not be negative./i)).toBeInTheDocument();
    });
    it('shows error message on input if value is zero', () => {
      render(<SuggestTrials studyName={fakeStudyName} />);

      userEvent.type(screen.getByTestId('suggestionInput'), '{backspace}0');

      expect(screen.getByText(/can not be zero./i)).toBeInTheDocument();
    });
    it('requests for suggestions and adds trial to table', async () => {
      const suggest = jest.fn((req, res, ctx) => {
        return res(ctx.json(fakePendingSuggestOperation));
      });
      const suggestResponse = jest.fn((req, res, ctx) => {
        return res(ctx.json(fakeSuggestOperationGetSuccess));
      });
      server.use(
        rest.post(proxyUrl(suggestTrialUrl()), suggest),
        rest.get(proxyUrl(operationGetUrl()), suggestResponse)
      );
      const { getState } = render(<SuggestTrials studyName={fakeStudyName} />);

      // {backspace} removes the value "1" that is already in the input
      userEvent.type(screen.getByTestId('suggestionInput'), '{backspace}10');

      userEvent.click(screen.getByText(/get suggestions/i));

      await waitFor(() =>
        expect(getState().snackbar.message).toEqual('Loading suggested trials.')
      );
      await waitFor(() =>
        expect(getState().snackbar.message).toEqual(
          'Successfully loaded suggest trials.'
        )
      );
      expect(screen.getByText(/new-trial/)).toBeInTheDocument();

      // ensure that the body of suggest call is valid
      expect(suggest).toHaveBeenCalled();
      const suggestBody = JSON.parse(suggest.mock.calls[0][0].body);
      expect(suggestBody.suggestionCount).toBe(10);
      expect(suggestBody.clientId).toBe('optimizer-extension');
    });
    it('is disabled if there is an pending suggested trial', async () => {
      // fakeTrial by default is active
      server.use(
        rest.get(proxyUrl(getTrialsUrl()), (req, res, ctx) => {
          return res(
            ctx.json({
              trials: [fakeTrial],
            })
          );
        })
      );
      render(<SuggestTrials studyName={fakeStudyName} />);

      // Wait for initial fetch
      await waitFor(() => screen.getByTestId('trialRow'));

      expect(screen.getByTestId('suggestionInput')).toBeDisabled();
    });
  });
  describe('trials table', () => {
    it('shows name, state, parameter values, and metric values', async () => {
      render(<SuggestTrials studyName={fakeStudyName} />);

      // Wait for initial fetch
      await waitFor(() => screen.getByTestId('trialRow'));

      // name
      expect(screen.getByText(/trial-default/i)).toBeInTheDocument();
      // state
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
      // parameters
      expect(screen.getByText('556')).toBeInTheDocument();
      expect(screen.getByText(/categorical-type/i)).toBeInTheDocument();
      // metrics
      expect(screen.getByText('101')).toBeInTheDocument();
      expect(screen.getByText('666')).toBeInTheDocument();
    });
    it('opens a add measurement window', async () => {
      render(<SuggestTrials studyName={fakeStudyName} />);

      // Wait for initial fetch
      await waitFor(() => screen.getByTestId('trialRow'));

      userEvent.click(screen.getByTestId('addMeasurement'));

      // wait for dialog text to show up
      await waitFor(() =>
        screen.getByText(`add measurement to "${cleanFakeTrialName}"`, {
          exact: false,
        })
      );
    });
    it('deletes a trial', async () => {
      const deleteTrial = jest.fn((req, res, ctx) => {
        return res(ctx.json({}));
      });
      server.use(
        rest.delete(
          proxyUrl(
            deleteTrialUrl({
              projectId: 'project-id',
              region: 'us-region',
              cleanStudyName: 'study-default',
              cleanTrialName: 'trial-default',
            })
          ),
          deleteTrial
        )
      );
      render(<SuggestTrials studyName={fakeStudyName} />);

      // Wait for initial fetch
      await waitFor(() => screen.getByTestId('trialRow'));

      // click on delete icon
      userEvent.click(screen.getByTestId('deleteTrial'));

      // wait for row to be deleted
      await waitForElementToBeRemoved(() => screen.getByTestId('trialRow'));
      expect(deleteTrial).toHaveBeenCalled();
    });
  });
  describe('add measurement', () => {
    let getState;
    beforeEach(async () => {
      // fakeTrial by default is active
      server.use(
        rest.get(proxyUrl(getTrialsUrl()), (req, res, ctx) => {
          return res(
            ctx.json({
              trials: [fakeTrial],
            })
          );
        })
      );
      getState = render(<SuggestTrials studyName={fakeStudyName} />).getState;

      // Wait for initial fetch
      await waitFor(() => screen.getByTestId('trialRow'));

      userEvent.click(screen.getByTestId('addMeasurement'));

      // Opens dialog
      await waitFor(() => screen.getByTestId('measurementDialog'));
    });

    // TODO: fix test warning messages
    it('submits metrics and shows snackbar message and closes', async () => {
      const completeTrial = jest.fn((req, res, ctx) => {
        return res(ctx.json(fakeTrialWithFinalMeasurement));
      });
      server.use(rest.post(proxyUrl(completeTrialUrl()), completeTrial));

      const inputs = screen.getAllByTestId('metricInput');
      expect(inputs).toHaveLength(2);

      userEvent.type(inputs[0], '1000');
      userEvent.type(inputs[1], '666');

      userEvent.click(screen.getByText(/submit/i));

      // Opens snackbar
      await waitFor(() =>
        expect(getState().snackbar.message).toEqual('Trial Completed!')
      );

      // Closes dialog
      await waitForElementToBeRemoved(() =>
        screen.queryByTestId('measurementDialog')
      );

      // Updates state to completed in table
      await waitFor(() => screen.getByText('COMPLETED'));
      // enables suggestion input
      await waitFor(() =>
        expect(screen.getByTestId('suggestionInput')).not.toBeDisabled()
      );

      expect(screen.queryByTestId('loadingSpinner')).not.toBeInTheDocument();
      // Calls complete trial api with valid inputs
      expect(completeTrial).toHaveBeenCalled();
      const completeBody = JSON.parse(completeTrial.mock.calls[0][0].body);
      expect(completeBody).toMatchInlineSnapshot(`
        Object {
          "finalMeasurement": Object {
            "metrics": Array [
              Object {
                "metric": "metric-unspecified",
                "value": 1000,
              },
              Object {
                "metric": "metric-maximize",
                "value": 666,
              },
            ],
            "stepCount": "1",
          },
        }
      `);
    });
    it('cancels and closes dialog', async () => {
      userEvent.click(screen.getByTestId('measureDialogCancel'));
      // Closes dialog
      await waitForElementToBeRemoved(() =>
        screen.queryByTestId('measurementDialog')
      );
    });
  });
});
