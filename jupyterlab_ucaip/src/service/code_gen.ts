import { NotebookActions } from '@jupyterlab/notebook';
import { Context } from '../components/ucaip_widget';

export abstract class CodeGenService {
  static generateCodeCell(
    context: Context,
    code: string,
    fallback: (code: string) => void | null
  ) {
    const notebookTracker = context.notebookTracker;
    const curWidget = notebookTracker.currentWidget;

    if (!curWidget) {
      if (fallback !== null) {
        fallback(code);
      }
    } else {
      const notebook = curWidget.content;
      if (!notebook.isVisible) {
        context.app.shell.activateById(curWidget.id);
      }
      if (notebook.activeCell.model.value.text !== '') {
        // Create a new cell if the current cell is not empty
        NotebookActions.insertBelow(notebook);
      }
      notebook.activeCell.model.value.text = code;
    }
  }

  static importDatasetCode(datasetId: string) {
    return `from jupyterlab_ucaip import import_dataset
df = import_dataset('${datasetId}')`;
  }

  static exportModelCode(path: string, displayName: string, framework: string) {
    return `from jupyterlab_ucaip import export_saved_model, ModelFramework

# Before running this, save your model locally in preferred format
# as shown below for Tensorflow models
# model.save("${path}")

model_path = "${path}"

# Export local model to uCAIP
model = export_saved_model(display_name="${displayName}",
                           model_path=model_path,
                           framework=ModelFramework.${framework})`;
  }
}
