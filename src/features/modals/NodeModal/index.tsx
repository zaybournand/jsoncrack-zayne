import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import {
  Modal,
  Stack,
  Text,
  ScrollArea,
  Flex,
  CloseButton,
  TextInput,
  Button,
  Group,
} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { NodeData } from "../../../types/graph";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

const normalizeNodeData = (nodeRows: NodeData["text"]) => {
  if (!nodeRows || nodeRows.length === 0) return "{}";
  if (nodeRows.length === 1 && !nodeRows[0].key) return `${nodeRows[0].value}`;

  const obj: Record<string, string> = {};
  nodeRows.forEach((row) => {
    if (row.type !== "array" && row.type !== "object") {
      if (row.key) obj[String(row.key)] = String(row.value ?? "");
    }
  });
  return JSON.stringify(obj, null, 2);
};

const jsonPathToString = (path?: NodeData["path"]) => {
  if (!path || path.length === 0) return "$";

  const validPath = path.filter(
    (seg): seg is string | number => seg !== null && seg !== undefined
  );

  const segments = validPath.map((seg) =>
    typeof seg === "number" ? seg : `"${seg}"`
  );
  return `$[${segments.join("][")}]`;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph((state) => state.selectedNode);
  const updateNodeValue = useGraph((state) => state.updateNodeValue);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (nodeData?.text) {
      const data: Record<string, string> = {};
      nodeData.text.forEach((row) => {
        if (row.key && row.type !== "array" && row.type !== "object") {
          data[String(row.key)] = String(row.value ?? "");
        }
      });
      setFormData(data);
      setIsEditing(false); 
    }
  }, [nodeData]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (nodeData?.id) {
      updateNodeValue(nodeData.id, formData);
    }
    setIsEditing(false);
    onClose();
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (nodeData?.text) {
      const reset: Record<string, string> = {};
      nodeData.text.forEach((row) => {
        if (row.key && row.type !== "array" && row.type !== "object") {
          reset[String(row.key)] = String(row.value ?? "");
        }
      });
      setFormData(reset);
    }
  };

  return (
    <Modal
      size="auto"
      opened={opened}
      onClose={onClose}
      centered
      withCloseButton={false}
    >
      <Stack pb="sm" gap="sm">
        {/* Header and Edit Button */}
        <Flex justify="space-between" align="center">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          <Group gap="xs">
            {!isEditing && (
              <Button size="xs" color="blue" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
            <CloseButton onClick={onClose} />
          </Group>
        </Flex>

        <ScrollArea.Autosize mah={250} maw={600}>
          {!isEditing ? (
            <CodeHighlight
              code={normalizeNodeData(nodeData?.text ?? [])}
              miw={350}
              maw={600}
              language="json"
              withCopyButton
            />
          ) : (
            <Stack gap="xs" p="xs">
              {Object.entries(formData).map(([key, value]) => (
                <TextInput
                  key={key}
                  label={key}
                  value={value} 
                  onChange={(e) => handleChange(key, e.currentTarget.value)}
                />
              ))}
              <Group justify="flex-end" mt="xs">
                <Button color="green" onClick={handleSave}>
                  Save
                </Button>
                <Button color="red" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </Group>
            </Stack>
          )}
        </ScrollArea.Autosize>

        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={jsonPathToString(nodeData?.path)}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy to clipboard"
            copiedLabel="Copied to clipboard"
            withCopyButton
          />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};