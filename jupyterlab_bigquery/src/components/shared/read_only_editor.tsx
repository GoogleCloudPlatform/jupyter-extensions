import * as React from 'react';
import { Paper } from '@material-ui/core';
import Editor from '@monaco-editor/react';
import { monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor/esm/vs/editor/editor.api';
import { isDarkTheme } from '../../utils/dark_theme';

function handleEditorDidMount(_, editor) {
  const editorElement = editor.getDomNode();
  if (!editorElement) {
    return;
  }

  monaco
    .init()
    .then(monaco => {
      const lineHeight = editor.getOption(
        monaco.editor.EditorOption.lineHeight
      );
      const lineCount = editor._modelData.viewModel.getLineCount();
      const height = lineCount * lineHeight;
      editorElement.style.height = `${height + 0.5 * lineHeight}px`;
      editor.layout();

      monaco.editor.defineTheme('viewOnlyQueryTheme', {
        base: isDarkTheme() ? 'vs-dark' : 'vs',
        inherit: true,
        rules: [],
        colors: {
          'editorCursor.foreground': isDarkTheme() ? '#1E1E1E' : '#FFFFFF',
          'editorGutter.background': isDarkTheme() ? '#111111' : '#f8f9fa',
        },
      });
      monaco.editor.setTheme('viewOnlyQueryTheme');
    })
    .catch(error =>
      console.error(
        'An error occurred during initialization of Monaco: ',
        error
      )
    );
}

const READ_ONLY_SQL_EDITOR_OPTIONS: editor.IEditorConstructionOptions = {
  lineNumbers: 'on',
  minimap: { enabled: false },
  readOnly: true,
  cursorStyle: 'line-thin',
  renderLineHighlight: 'none',
  overviewRulerLanes: 0,
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  matchBrackets: 'never',
  occurrencesHighlight: false,
  folding: false,
  scrollBeyondLastLine: false,
  scrollbar: {
    handleMouseWheel: false,
  },
};

const ReadOnlyEditor = props => {
  return (
    <Paper
      variant="outlined"
      style={{ border: '1px solid var(--jp-border-color2)' }}
    >
      <Editor
        width="100%"
        theme={'vs'}
        language={'sql'}
        value={props.query}
        options={READ_ONLY_SQL_EDITOR_OPTIONS}
        editorDidMount={handleEditorDidMount}
      />
    </Paper>
  );
};

export default ReadOnlyEditor;
