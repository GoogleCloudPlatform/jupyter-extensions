declare module 'react-resize-aware' {
  type ResizeElement = JSX.Element;

  interface Sizes {
    width: number;
    height: number;
  }

  export default function useResizeAware(): [ResizeElement, Sizes];
}
