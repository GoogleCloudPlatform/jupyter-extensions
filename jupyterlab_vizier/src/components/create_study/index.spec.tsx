import * as React from 'react';
import { createDropdown, CreateStudy } from '.';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import * as Types from '../../types';
import {
  screen,
  render,
  waitFor,
  waitForElementToBeRemoved,
} from '../../utils/redux_render';
import { proxyUrl, createStudyUrl } from '../../utils/urls';
import { fakeStudy, cleanFakeStudyName } from '../../service/test_constants';
import userEvent from '@testing-library/user-event';
import { DropdownItem } from './types';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Test helpers
interface Conditional {
  parentName: string;
  parentValues: string[];
}

const createConditional = async ({ parentName, parentValues }: Conditional) => {
  // enable parameter as condition
  const enableConditional = await screen.findByText(
    /this is a conditional \(child\) parameter/i
  );
  expect(enableConditional).not.toBeDisabled();
  userEvent.click(enableConditional);
  // click on parent selection input to show dropdown
  userEvent.click(await screen.findByLabelText(/parent parameter/i));
  // click on parent parameter name
  userEvent.click(await screen.findByTestId(`parent-${parentName}`));

  for (const value of parentValues) {
    // select the parent values
    userEvent.click(await screen.findByLabelText(/parent values/i));
    userEvent.click(await screen.findByTestId(`parentValue-${value}`));
  }
};

const openParameterBox = async () => {
  userEvent.click(screen.getByText(/add parameter/i));
  await waitFor(() => screen.getByText(/save/i));
};

const createIntegerParameter = async ({
  name,
  min,
  max,
  conditional,
}: {
  name: string;
  min: string;
  max: string;
  conditional?: Conditional;
}) => {
  await openParameterBox();
  // Integer
  userEvent.type(screen.getByLabelText(/parameter name/i), name);
  userEvent.click(screen.getByLabelText(/parameter type/i));
  userEvent.click(await screen.findByText('INTEGER'));
  // Wait for Parameter dropdown to close
  await waitForElementToBeRemoved(() => screen.queryAllByTestId('paramType'));
  userEvent.type(screen.getByLabelText(/min value/i), min);
  userEvent.type(screen.getByLabelText(/max value/i), max);
  if (conditional) await createConditional(conditional);
  userEvent.click(screen.getByText(/save/i));
};

const createDoubleParameter = async ({
  name,
  min,
  max,
  conditional,
}: {
  name: string;
  min: string;
  max: string;
  conditional?: Conditional;
}) => {
  await openParameterBox();
  // Double
  userEvent.type(screen.getByLabelText(/parameter name/i), name);
  userEvent.click(screen.getByLabelText(/parameter type/i));
  userEvent.click(await screen.findByText('DOUBLE'));
  // Wait for parameter dropdown to close
  await waitForElementToBeRemoved(() => screen.queryAllByTestId('paramType'));
  userEvent.type(screen.getByLabelText(/min value/i), min);
  userEvent.type(screen.getByLabelText(/max value/i), max);
  if (conditional) await createConditional(conditional);
  userEvent.click(screen.getByText(/save/i));
};

const createDiscreteParameter = async ({
  name,
  values,
  conditional,
}: {
  name: string;
  values: string;
  conditional?: Conditional;
}) => {
  await openParameterBox();
  userEvent.type(screen.getByLabelText(/parameter name/i), name);
  userEvent.click(screen.getByLabelText(/parameter type/i));
  userEvent.click(await screen.findByText('DISCRETE'));
  // Wait for Parameter dropdown to close
  await waitForElementToBeRemoved(() => screen.queryAllByTestId('paramType'));
  userEvent.type(
    await screen.findByLabelText(/list of possible values/i),
    values
  );

  if (conditional) await createConditional(conditional);

  userEvent.click(screen.getByText(/save/i));
};

const createCategoricalParameter = async ({
  name,
  values,
  conditional,
}: {
  name: string;
  values: string;
  conditional?: Conditional;
}) => {
  await openParameterBox();
  userEvent.type(screen.getByLabelText(/parameter name/i), name);
  userEvent.click(screen.getByLabelText(/parameter type/i));
  const categoricalOption = await waitFor(() =>
    screen.getByText('CATEGORICAL')
  );
  userEvent.click(categoricalOption);
  // Wait for Parameter dropdown to close
  await waitForElementToBeRemoved(() => screen.queryAllByTestId('paramType'));
  userEvent.type(
    await screen.findByLabelText(/list of possible values/i),
    values
  );

  if (conditional) await createConditional(conditional);

  userEvent.click(screen.getByText(/save/i));
};

const openMetricBox = async () => {
  userEvent.click(screen.getByText(/add metric/i));
  await waitFor(() => screen.getByText(/save/i));
};

const createMinimizedMetric = async () => {
  await openMetricBox();
  // Metric name
  userEvent.type(screen.getByLabelText(/metric name/i), 'goLow');
  // Goal type for metric
  userEvent.click(screen.getByTestId('metricGoalType'));
  const firstGoalType = await waitFor(() => screen.getByText(/minimize/i));
  userEvent.click(firstGoalType);
  // Add metric to list
  userEvent.click(screen.getByText(/save/i));
};

const createMaximizedMetric = async () => {
  await openMetricBox();
  // Metric name
  userEvent.type(screen.getByLabelText(/metric name/i), 'goHigh');
  // Goal type for metric
  userEvent.click(screen.getByTestId('metricGoalType'));
  const secondGoalType = await waitFor(() => screen.getByText(/maximize/i));
  userEvent.click(secondGoalType);
  // Add metric to list
  userEvent.click(screen.getByText(/save/i));
};

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
    jest.setTimeout(100000);
    const createStudy = jest.fn((req, res, ctx) => {
      return res(ctx.json(fakeStudy));
    });
    server.use(rest.post(proxyUrl(createStudyUrl()), createStudy));

    const { getState } = render(<CreateStudy />);

    // Add study name
    userEvent.type(screen.getByLabelText(/study name/i), cleanFakeStudyName);

    // Add all types of parameters
    await createIntegerParameter({
      name: 'intValue',
      min: '1',
      max: '5',
    });
    await createDoubleParameter({
      name: 'doubValue',
      min: '-10',
      max: '15',
    });
    await createDiscreteParameter({
      name: 'disValue',
      values: '-2,-1,0,1,2,666,42',
    });
    await createCategoricalParameter({
      name: 'catValue',
      values: 'small,medium,large',
    });

    // Add metrics
    await createMinimizedMetric();
    await createMaximizedMetric();

    // Pick an Algorithm
    userEvent.click(screen.getByLabelText(/algorithm type/i));
    // Wait for selection window animation to finish
    const randomSearchOption = await waitFor(() =>
      screen.getByText(/random_search/i)
    );
    userEvent.click(randomSearchOption);

    // Submit
    const submit = screen.getByTestId('createStudy');
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
  /*
  +--------------------------------------------------------------------------------------+
  |                                       Root Nodes                                     |
  |                                                                                      |
  |   +------------------+              +--------------+             +---------------+   |
  |   | Categorical Tree |              | Integer Tree |             | Discrete Tree |   |
  |   +-------|----------+              +--------------+             +-------|-------+   |
  |           |                                 |                            |           |
  +--------------------------------------------------------------------------------------+
              |                                 |                             |           
      +-------|-------+             +-----------------------+       +---------|--------+  
      | Int Parameter |             | Categorical Parameter |       | Double Parameter |  
      +---------------+             +-----------|-----------+       +------------------+  
                                                |                                         
                                                |                                      
                                      +---------|--------+                                
                                      | Double Parameter |                                
                                      +------------------+                                
  */
  it('creates a tree study and submits it', async () => {
    jest.setTimeout(100000);
    const createStudy = jest.fn((req, res, ctx) => {
      return res(ctx.json(fakeStudy));
    });
    server.use(rest.post(proxyUrl(createStudyUrl()), createStudy));

    const { getState } = render(<CreateStudy />);

    // Add study name
    userEvent.type(screen.getByLabelText(/study name/i), cleanFakeStudyName);

    // Pick an Algorithm
    userEvent.click(screen.getByLabelText(/algorithm type/i));
    userEvent.click(await screen.findByText(/random_search/i));

    await createCategoricalParameter({
      name: 'parent-categorical',
      values: 'rnn,dnn',
    });
    await createIntegerParameter({
      name: 'child-integer',
      min: '-10',
      max: '10',
      conditional: { parentName: 'parent-categorical', parentValues: ['rnn'] },
    });

    await createDiscreteParameter({
      name: 'parent-discrete',
      values: '1,2,3,42314,666',
    });
    await createCategoricalParameter({
      name: 'child-categorical',
      values: 'a,b,c',
      conditional: {
        parentName: 'parent-discrete',
        parentValues: ['1', '666'],
      },
    });
    await createDoubleParameter({
      name: 'child-child-double',
      min: '-41234',
      max: '-5',
      conditional: {
        parentName: 'child-categorical',
        parentValues: ['c', 'a'],
      },
    });

    await createIntegerParameter({
      name: 'parent-integer',
      min: '1000',
      max: '2000',
    });
    await createDoubleParameter({
      name: 'child-double',
      min: '.5',
      max: '1.5',
      conditional: {
        parentName: 'parent-integer',
        parentValues: ['1000', '2000', '1451'],
      },
    });

    // Submit
    const submit = screen.getByTestId('createStudy');
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
          "metrics": Array [],
          "parameters": Array [
            Object {
              "categoricalValueSpec": Object {
                "values": Array [
                  "rnn",
                  "dnn",
                ],
              },
              "childParameterSpecs": Array [
                Object {
                  "integerValueSpec": Object {
                    "maxValue": "10",
                    "minValue": "-10",
                  },
                  "parameter": "child-integer",
                  "parentCategoricalValues": Object {
                    "values": Array [
                      "rnn",
                    ],
                  },
                  "type": "INTEGER",
                },
              ],
              "parameter": "parent-categorical",
              "type": "CATEGORICAL",
            },
            Object {
              "childParameterSpecs": Array [
                Object {
                  "categoricalValueSpec": Object {
                    "values": Array [
                      "a",
                      "b",
                      "c",
                    ],
                  },
                  "childParameterSpecs": Array [
                    Object {
                      "doubleValueSpec": Object {
                        "maxValue": -5,
                        "minValue": -41234,
                      },
                      "parameter": "child-child-double",
                      "parentCategoricalValues": Object {
                        "values": Array [
                          "c",
                          "a",
                        ],
                      },
                      "type": "DOUBLE",
                    },
                  ],
                  "parameter": "child-categorical",
                  "parentDiscreteValues": Object {
                    "values": Array [
                      1,
                      666,
                    ],
                  },
                  "type": "CATEGORICAL",
                },
              ],
              "discreteValueSpec": Object {
                "values": Array [
                  1,
                  2,
                  3,
                  42314,
                  666,
                ],
              },
              "parameter": "parent-discrete",
              "type": "DISCRETE",
            },
            Object {
              "childParameterSpecs": Array [
                Object {
                  "doubleValueSpec": Object {
                    "maxValue": 1.5,
                    "minValue": 0.5,
                  },
                  "parameter": "child-double",
                  "parentIntValues": Object {
                    "values": Array [
                      1000,
                      2000,
                      1451,
                    ],
                  },
                  "type": "DOUBLE",
                },
              ],
              "integerValueSpec": Object {
                "maxValue": "2000",
                "minValue": "1000",
              },
              "parameter": "parent-integer",
              "type": "INTEGER",
            },
          ],
        },
      }
    `);
  });

  describe('parameter list', () => {
    beforeEach(async () => {
      jest.setTimeout(100000);
      render(<CreateStudy />);

      await createIntegerParameter({
        name: 'intValue',
        min: '1',
        max: '5',
      });
      await createDoubleParameter({
        name: 'doubValue',
        min: '-10',
        max: '15',
      });
    });

    it('can remove a parameter', async () => {
      expect(screen.getAllByTestId('paramChip')).toHaveLength(2);

      userEvent.click(screen.getAllByTestId('deleteParameter')[0]);
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
      jest.setTimeout(100000);
      render(<CreateStudy />);

      await createMinimizedMetric();
      await createMaximizedMetric();
    });

    it('can remove a metric', async () => {
      expect(screen.getAllByTestId('metricChip')).toHaveLength(2);
      userEvent.click(screen.getAllByTestId('deleteMetric')[0]);
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
