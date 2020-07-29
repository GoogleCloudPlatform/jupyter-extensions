import * as React from 'react';
import { createDropdown, DropdownItem, CreateStudy } from './create_study';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import * as Types from '../types';
import {
  screen,
  render,
  waitFor,
  waitForElementToBeRemoved,
} from '../utils/redux_render';
import { proxyUrl, createStudyUrl } from '../utils/urls';
import { fakeStudy, cleanFakeStudyName } from '../service/test-constants';
import userEvent from '@testing-library/user-event';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

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

describe('Create Study Page', () => {
  it('creates a study and redirects to the study details page', async () => {
    const createStudy = jest.fn((req, res, ctx) => {
      return res(ctx.json(fakeStudy));
    });
    server.use(rest.post(proxyUrl(createStudyUrl()), createStudy));

    const { getState } = render(<CreateStudy />);

    // Add study name
    userEvent.type(screen.getByLabelText(/study name/i), cleanFakeStudyName);

    // Add all types of parameters
    // Integer
    userEvent.type(screen.getByLabelText(/parameter name/i), 'intValue');
    userEvent.click(screen.getByLabelText(/parameter type/i));
    const integerOption = await waitFor(() => screen.getByText('INTEGER'));
    userEvent.click(integerOption);
    // Wait for Parameter dropdown to close
    await waitForElementToBeRemoved(() => screen.queryAllByTestId('paramType'));
    await waitFor(() =>
      expect(screen.getByLabelText(/min value/i)).not.toBeDisabled()
    );
    expect(screen.getByLabelText(/max value/i)).not.toBeDisabled();
    userEvent.type(screen.getByLabelText(/min value/i), '1');
    userEvent.type(screen.getByLabelText(/max value/i), '5');
    userEvent.click(screen.getByText(/add param/i));
    // Double
    userEvent.type(screen.getByLabelText(/parameter name/i), 'doubValue');
    userEvent.click(screen.getByLabelText(/parameter type/i));
    const doubleOption = await waitFor(() => screen.getByText('DOUBLE'));
    userEvent.click(doubleOption);
    // Wait for Parameter dropdown to close
    await waitForElementToBeRemoved(() => screen.queryAllByTestId('paramType'));
    await waitFor(() =>
      expect(screen.getByLabelText(/min value/i)).not.toBeDisabled()
    );
    expect(screen.getByLabelText(/max value/i)).not.toBeDisabled();
    userEvent.type(screen.getByLabelText(/min value/i), '-10');
    userEvent.type(screen.getByLabelText(/max value/i), '15');
    userEvent.click(screen.getByText(/add param/i));
    // Discrete
    userEvent.type(screen.getByLabelText(/parameter name/i), 'disValue');
    userEvent.click(screen.getByLabelText(/parameter type/i));
    const discreteOption = await waitFor(() => screen.getByText('DISCRETE'));
    userEvent.click(discreteOption);
    // Wait for Parameter dropdown to close
    await waitForElementToBeRemoved(() => screen.queryAllByTestId('paramType'));
    await waitFor(() =>
      expect(
        screen.getByLabelText(/list of possible values/i)
      ).not.toBeDisabled()
    );
    userEvent.type(
      screen.getByLabelText(/list of possible values/i),
      '-2,-1,0,1,2,666,42'
    );
    userEvent.click(screen.getByText(/add param/i));
    // Categorical
    userEvent.type(screen.getByLabelText(/parameter name/i), 'catValue');
    userEvent.click(screen.getByLabelText(/parameter type/i));
    const categoricalOption = await waitFor(() =>
      screen.getByText('CATEGORICAL')
    );
    userEvent.click(categoricalOption);
    // Wait for Parameter dropdown to close
    await waitForElementToBeRemoved(() => screen.queryAllByTestId('paramType'));
    await waitFor(() =>
      expect(
        screen.getByLabelText(/list of possible values/i)
      ).not.toBeDisabled()
    );
    userEvent.type(
      screen.getByLabelText(/list of possible values/i),
      'small,medium,large'
    );
    userEvent.click(screen.getByText(/add param/i));

    // Add both types of metrics
    // First Metric
    // Metric name
    userEvent.type(screen.getByLabelText(/metric name/i), 'goLow');
    // Goal type for metric
    userEvent.click(screen.getByTestId('metricGoalType'));
    const firstGoalType = await waitFor(() => screen.getByText(/minimize/i));
    userEvent.click(firstGoalType);
    // Add metric to list
    userEvent.click(screen.getByText(/add metric/i));

    // Second metric
    // Metric name
    userEvent.type(screen.getByLabelText(/metric name/i), 'goHigh');
    // Goal type for metric
    userEvent.click(screen.getByTestId('metricGoalType'));
    const secondGoalType = await waitFor(() => screen.getByText(/maximize/i));
    userEvent.click(secondGoalType);
    // Add metric to list
    userEvent.click(screen.getByText(/add metric/i));

    // Pick an Algorithm
    userEvent.click(screen.getByLabelText(/algorithm type/i));
    // Wait for selection window animation to finish
    const randomSearchOption = await waitFor(() =>
      screen.getByText(/random_search/i)
    );
    userEvent.click(randomSearchOption);

    // Submit
    const submit = screen.getByText(/create study/i);
    expect(submit).not.toBeDisabled();
    userEvent.click(submit);

    // Redirect
    await waitFor(() =>
      expect(getState().view.data).toEqual({
        view: 'studyDetails',
        studyId: fakeStudy.name,
      })
    );

    // Make sure the api body is correct
    expect(createStudy).toHaveBeenCalled();
    const createStudyBody = JSON.parse(createStudy.mock.calls[0][0].body);
    expect(createStudyBody).toMatchInlineSnapshot(`
      Object {
        "name": "study-default",
        "studyConfig": Object {
          "algorithm": "RANDOM_SEARCH",
          "metrics": Array [
            Object {
              "goal": "MINIMIZE",
              "metric": "goLow",
            },
            Object {
              "goal": "MAXIMIZE",
              "metric": "goHigh",
            },
          ],
          "parameters": Array [
            Object {
              "integerValueSpec": Object {
                "maxValue": "5",
                "minValue": "1",
              },
              "parameter": "intValue",
              "type": "INTEGER",
            },
            Object {
              "doubleValueSpec": Object {
                "maxValue": 15,
                "minValue": -10,
              },
              "parameter": "doubValue",
              "type": "DOUBLE",
            },
            Object {
              "discreteValueSpec": Object {
                "values": Array [
                  -2,
                  -1,
                  0,
                  1,
                  2,
                  666,
                  42,
                ],
              },
              "parameter": "disValue",
              "type": "DISCRETE",
            },
            Object {
              "categoricalValueSpec": Object {
                "values": Array [
                  "small",
                  "medium",
                  "large",
                ],
              },
              "parameter": "catValue",
              "type": "CATEGORICAL",
            },
          ],
        },
      }
    `);
  });
  describe('parameter list', () => {
    beforeEach(async () => {
      render(<CreateStudy />);

      // Create two parameters
      // Integer
      userEvent.type(screen.getByLabelText(/parameter name/i), 'intValue');
      userEvent.click(screen.getByLabelText(/parameter type/i));
      const integerOption = await waitFor(() => screen.getByText('INTEGER'));
      userEvent.click(integerOption);
      // Wait for Parameter dropdown to close
      await waitForElementToBeRemoved(() =>
        screen.queryAllByTestId('paramType')
      );
      await waitFor(() =>
        expect(screen.getByLabelText(/min value/i)).not.toBeDisabled()
      );
      expect(screen.getByLabelText(/max value/i)).not.toBeDisabled();
      userEvent.type(screen.getByLabelText(/min value/i), '1');
      userEvent.type(screen.getByLabelText(/max value/i), '5');
      userEvent.click(screen.getByText(/add param/i));
      // Double
      userEvent.type(screen.getByLabelText(/parameter name/i), 'doubValue');
      userEvent.click(screen.getByLabelText(/parameter type/i));
      const doubleOption = await waitFor(() => screen.getByText('DOUBLE'));
      userEvent.click(doubleOption);
      // Wait for parameter dropdown to close
      await waitForElementToBeRemoved(() =>
        screen.queryAllByTestId('paramType')
      );
      await waitFor(() =>
        expect(screen.getByLabelText(/min value/i)).not.toBeDisabled()
      );
      expect(screen.getByLabelText(/max value/i)).not.toBeDisabled();
      userEvent.type(screen.getByLabelText(/min value/i), '-10');
      userEvent.type(screen.getByLabelText(/max value/i), '15');
      userEvent.click(screen.getByText(/add param/i));
    });

    it('can remove a parameter', async () => {
      expect(screen.getAllByTestId('paramChip')).toHaveLength(2);
      userEvent.click(screen.getByText('doubValue'));
      // Wait for animation
      await waitFor(() =>
        expect(screen.getByText(/delete param/i)).not.toBeDisabled()
      );
      userEvent.click(screen.getByText(/delete param/i));
      // Wait for animation
      await waitFor(() =>
        expect(screen.getAllByTestId('paramChip')).toHaveLength(1)
      );
    });

    it("can select an old parameter, updating inputs to match it's contents", async () => {
      userEvent.click(screen.getByText('intValue'));

      // Parameter name input updates
      await waitFor(() =>
        expect(screen.getByLabelText(/parameter name/i)).toHaveValue('intValue')
      );
      // Parameter type value is updated to "INTEGER"
      expect(screen.getByText('INTEGER')).toBeInTheDocument();
    });
  });

  describe('metric list', () => {
    beforeEach(async () => {
      render(<CreateStudy />);

      // Add both types of metrics
      // First Metric
      // Metric name
      userEvent.type(screen.getByLabelText(/metric name/i), 'goLow');
      // Goal type for metric
      userEvent.click(screen.getByTestId('metricGoalType'));
      const firstGoalType = await waitFor(() => screen.getByText(/minimize/i));
      userEvent.click(firstGoalType);
      // Add metric to list
      userEvent.click(screen.getByText(/add metric/i));
      // Wait for dropdown to close
      await waitForElementToBeRemoved(() =>
        screen.queryAllByTestId('metricItem')
      );

      // Second metric
      // Metric name
      userEvent.type(screen.getByLabelText(/metric name/i), 'goHigh');
      // Goal type for metric
      userEvent.click(screen.getByTestId('metricGoalType'));
      const secondGoalType = await waitFor(() => screen.getByText(/maximize/i));
      userEvent.click(secondGoalType);
      // Add metric to list
      userEvent.click(screen.getByText(/add metric/i));
      // Wait for dropdown to close
      await waitForElementToBeRemoved(() =>
        screen.queryAllByTestId('metricItem')
      );
    });

    it('can remove a metric', async () => {
      expect(screen.getAllByTestId('metricChip')).toHaveLength(2);
      userEvent.click(screen.getByText('goHigh'));
      // Wait for animation
      await waitFor(() =>
        expect(screen.getByText(/add metric/i)).not.toBeDisabled()
      );
      userEvent.click(screen.getByText(/delete metric/i));
      // Wait for animation
      await waitFor(() =>
        expect(screen.getAllByTestId('metricChip')).toHaveLength(1)
      );
    });

    it("can select an old metric, updating inputs to match it's contents", async () => {
      userEvent.click(screen.getByText('goLow'));

      // Metric name input updates
      await waitFor(() =>
        expect(screen.getByLabelText(/metric name/i)).toHaveValue('goLow')
      );
      // Metric type value is updated to "INTEGER"
      expect(screen.getByText('MINIMIZE')).toBeInTheDocument();
    });
  });
});
