import { style } from 'typestyle';

export const setupClass = style({
  width: '100%',
  height: '20%',
  borderBottom: 'var(--jp-border-width) solid var(--jp-toolbar-border-color)',
});

export const setupItemClass = style({
  display: 'block !important',
  height: '40%',
  paddingBottom: '5px !important',
  paddingLeft: '10px !important',
  paddingRight: '10px !important',
  paddingTop: '5px !important',
});

export const setupItemInnerClass = style({
  width: '100%',
  height: '70%',
});

export const setupHelperTextClass = style({
  margin: '0 !important',
});
