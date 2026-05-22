"use client";

import { Button, Modal } from "antd";

import { useAssetStore } from "@/stores/use-asset-store";
import { useCanvasStore } from "../stores/use-canvas-store";
import { useCanvasUiStore } from "../stores/use-canvas-ui-store";

export function CanvasDeleteProjectsDialog() {
  const ids = useCanvasUiStore((state) => state.deleteProjectIds);
  const setDeleteIds = useCanvasUiStore((state) => state.setDeleteProjectIds);
  const removeSelectedIds = useCanvasUiStore((state) => state.removeSelectedProjectIds);
  const deleteProjects = useCanvasStore((state) => state.deleteProjects);
  const cleanupImages = useAssetStore((state) => state.cleanupImages);
  const confirm = () => {
    deleteProjects(ids);
    cleanupImages();
    removeSelectedIds(ids);
    setDeleteIds([]);
  };

  return (
    <Modal
      title="Xóa canvas?"
      open={ids.length > 0}
      centered
      onCancel={() => setDeleteIds([])}
      footer={<><Button onClick={() => setDeleteIds([])}>Hủy</Button><Button danger type="primary" onClick={confirm}>Xóa</Button></>}
    >
      <p className="text-sm text-stone-500">Sẽ xóa {ids.length} canvas, các nút và kết nối bên trong cũng sẽ bị xóa.</p>
    </Modal>
  );
}
