import { style } from 'typestyle';

export const toolbarClass = style({
  justifyContent: 'space-evenly',
  height: '5%',
});

export const toolbarItemClass = style({
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'var(--jp-private-toolbar-height)',
  width: '25%',
});

export const toolbarButtonClass = style({
  width: '100%',
});

export const toolbarButtonIconClass = style({
  alignItems: 'center',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '80%',
  display: 'inline-block',
  height: '24px',
  margin: 'auto',
  verticalAlign: 'middle',
  width: '24px',
});
