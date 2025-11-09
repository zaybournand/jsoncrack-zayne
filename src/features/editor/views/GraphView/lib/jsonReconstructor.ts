import { modify, applyEdits } from "jsonc-parser";
import type { NodeData } from "../../../../../types/graph";

export const reconstructor = (
  json: string,
  updatedNode: NodeData,
  newData: Record<string, any>
): string => {
  const nodePath = updatedNode.path; 
  if (!nodePath || nodePath.length === 0) return json;

  let currentJson = json;

  const formattingOptions = {
    formattingOptions: { insertSpaces: true, tabSize: 2 },
  };

  // Iterate over the key/value pairs submitted from the edit modal.
  Object.entries(newData).forEach(([key, value]) => {
    const fieldPath = [...nodePath, key];

    // Generate the edits required to modify the value at the fieldPath.
    const edits = modify(
      currentJson,
      fieldPath,
      value, 
      formattingOptions
    );
    currentJson = applyEdits(currentJson, edits);
  });

  return currentJson;
};