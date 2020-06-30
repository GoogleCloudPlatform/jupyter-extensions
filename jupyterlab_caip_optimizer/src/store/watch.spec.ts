import { watch } from './watch';

const waitForSubscriber = <T>(
  subscriber: ReturnType<typeof watch>
): Promise<T> => {
  return new Promise(resolve =>
    subscriber(change => {
      resolve(change as T);
    })()
  );
};

describe('watch', () => {
  it('triggers onChange when change happens', async () => {
    expect.assertions(2);

    const state = {
      value: false,
    };
    const newState = {
      value: true,
    };

    const getStore = jest.fn();
    const select = jest.fn().mockImplementation(state => state.value);
    const same = jest
      .fn()
      .mockImplementation((previous, next) => previous === next);

    const subscriber = watch(getStore, select, same);

    getStore.mockReturnValueOnce(state);
    getStore.mockReturnValueOnce(newState);

    const firstChange = await waitForSubscriber(subscriber);
    const secondChange = await waitForSubscriber(subscriber);

    expect(firstChange).toBe(false);
    expect(secondChange).toBe(true);
  });
  it('does not trigger change when changes does not happen', async () => {
    expect.assertions(1);

    const state = {
      value: false,
    };
    const newState = {
      value: false,
    };

    const getStore = jest.fn();
    const select = jest.fn().mockImplementation(state => state.value);
    const same = jest
      .fn()
      .mockImplementation((previous, next) => previous === next);

    const subscriber = watch(getStore, select, same);

    getStore.mockReturnValueOnce(state);
    getStore.mockReturnValueOnce(newState);

    await waitForSubscriber(subscriber);
    const onChange = jest.fn();
    subscriber(onChange);

    expect(onChange).not.toHaveBeenCalled();
  });
});
