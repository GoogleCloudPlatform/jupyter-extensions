/**
 * Creates HTML for tooltip from the selected data point
 * @param data Data point object to display
 */
export const getTooltipHTML = data => {
    const keys = Object.keys(data);
    const dataList = keys.map(key => `${key}: ${data[key]}`);
    return dataList.join('<br/>');
  };

// Color scheme for various lines on lineGraph
export const colorScheme = ['darkblue', 'crimson', 'green', 'yellow'];