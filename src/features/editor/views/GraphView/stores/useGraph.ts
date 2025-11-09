import type { ViewPort } from "react-zoomable-ui/dist/ViewPort";
import type { CanvasDirection } from "reaflow/dist/layout/elkLayout";
import { create } from "zustand";
import { SUPPORTED_LIMIT } from "../../../../../constants/graph";
import useFile from "../../../../../store/useFile";
import type { EdgeData, NodeData, NodeRow } from "../../../../../types/graph";
import { parser } from "../lib/jsonParser";
import { reconstructor } from "../lib/jsonReconstructor";

export interface Graph {
  viewPort: ViewPort | null;
  direction: CanvasDirection;
  loading: boolean;
  fullscreen: boolean;
  nodes: NodeData[];
  edges: EdgeData[];
  selectedNode: NodeData | null;
  path: string;
  aboveSupportedLimit: boolean;
}

const initialStates: Graph = {
  viewPort: null,
  direction: "RIGHT",
  loading: true,
  fullscreen: false,
  nodes: [],
  edges: [],
  selectedNode: null,
  path: "",
  aboveSupportedLimit: false,
};

interface GraphActions {
  setGraph: (json?: string, options?: Partial<Graph>[]) => void;
  setLoading: (loading: boolean) => void;
  setDirection: (direction: CanvasDirection) => void;
  setViewPort: (ref: ViewPort) => void;
  setSelectedNode: (nodeData: NodeData) => void;
  focusFirstNode: () => void;
  toggleFullscreen: (value: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  centerView: () => void;
  clearGraph: () => void;
  setZoomFactor: (zoomFactor: number) => void;
  updateNodeValue: (id: string, newData: Record<string, any>) => void;
}

const useGraph = create<Graph & GraphActions>((set, get) => ({
  ...initialStates,

  clearGraph: () => set({ nodes: [], edges: [], loading: false }),

  setSelectedNode: (nodeData) => set({ selectedNode: nodeData }),

  setGraph: (data, options) => {
    const { nodes, edges } = parser(data ?? useFile.getState().contents);

    if (nodes.length > SUPPORTED_LIMIT) {
      return set({
        aboveSupportedLimit: true,
        ...options,
        loading: false,
      });
    }

    set({
      nodes,
      edges,
      aboveSupportedLimit: false,
      ...options,
    });
  },

  setDirection: (direction = "RIGHT") => {
    set({ direction });
    setTimeout(() => get().centerView(), 200);
  },

  setLoading: (loading) => set({ loading }),

  focusFirstNode: () => {
    const rootNode = document.querySelector("g[id$='node-1']");
    get().viewPort?.camera?.centerFitElementIntoView(rootNode as HTMLElement, {
      elementExtraMarginForZoom: 100,
    });
  },

  setZoomFactor: (zoomFactor) => {
    const viewPort = get().viewPort;
    viewPort?.camera?.recenter(viewPort.centerX, viewPort.centerY, zoomFactor);
  },

  zoomIn: () => {
    const viewPort = get().viewPort;
    viewPort?.camera?.recenter(
      viewPort.centerX,
      viewPort.centerY,
      viewPort.zoomFactor + 0.1
    );
  },

  zoomOut: () => {
    const viewPort = get().viewPort;
    viewPort?.camera?.recenter(
      viewPort.centerX,
      viewPort.centerY,
      viewPort.zoomFactor - 0.1
    );
  },

  centerView: () => {
    const viewPort = get().viewPort;
    viewPort?.updateContainerSize();

    const canvas = document.querySelector(".jsoncrack-canvas") as HTMLElement | null;
    if (canvas) {
      viewPort?.camera?.centerFitElementIntoView(canvas);
    }
  },

  toggleFullscreen: (fullscreen) => set({ fullscreen }),

  setViewPort: (viewPort) => set({ viewPort }),

  updateNodeValue: (id, newData) => {
    set((state): Partial<Graph> => {
      const originalNode = state.nodes.find((n) => n.id === id);

      if (!originalNode) {
        return {};
      }
      const updatedText: NodeRow[] = originalNode.text.map((originalRow) => {
        
        if (originalRow.key === null || originalRow.key === undefined) {
            return originalRow;
        }

        const key = originalRow.key;
        
        if (Object.prototype.hasOwnProperty.call(newData, key)) {
          const newValue = newData[key];
          let valueType: NodeRow["type"];

          if (Array.isArray(newValue)) valueType = "array";
          else if (newValue === null) valueType = "null";
          else if (typeof newValue === "object") valueType = "object";
          else if (typeof newValue === "number") valueType = "number";
          else if (typeof newValue === "boolean") valueType = "boolean";
          else valueType = "string";

          return {
            key: key,
            value: newValue,
            type: valueType as NodeRow["type"],
          };
        }
        
        return originalRow;
      });

      const updatedNodes = state.nodes.map((n) => {
        if (n.id === id) {
          return { ...n, text: updatedText };
        }
        return n;
      });

      const updatedSelected =
        state.selectedNode && state.selectedNode.id === id
          ? ({
              ...state.selectedNode,
              text: updatedText,
            } as NodeData)
          : state.selectedNode;

      const currentSourceJson = useFile.getState().contents;
          
      const newJsonString = reconstructor(
        currentSourceJson, 
        {...originalNode, text: updatedText}, 
        newData
      ); 
      useFile.getState().setContents({ contents: newJsonString, skipUpdate: false }); 

      return { nodes: updatedNodes, selectedNode: updatedSelected };
    });
  },
  
}));

export default useGraph;