"use client";

import { App, Button, Form, Input, Modal } from "antd";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { ModelPicker } from "@/components/model-picker";
import { fetchImageModels } from "@/services/api/image";
import { useConfigStore, useEffectiveConfig, type AiConfig } from "@/stores/use-config-store";

export function AppConfigModal() {
  const { message } = App.useApp();
  const t = useTranslations("common");
  const [loadingModels, setLoadingModels] = useState(false);
  const config = useConfigStore((state) => state.config);
  const updateConfig = useConfigStore((state) => state.updateConfig);
  const isConfigOpen = useConfigStore((state) => state.isConfigOpen);
  const shouldPromptContinue = useConfigStore((state) => state.shouldPromptContinue);
  const setConfigDialogOpen = useConfigStore((state) => state.setConfigDialogOpen);
  const clearPromptContinue = useConfigStore((state) => state.clearPromptContinue);

  const finishConfig = () => {
    setConfigDialogOpen(false);
    if (!config.baseUrl.trim() || !config.apiKey.trim()) return;
    if (!config.imageModel.trim() || !config.textModel.trim()) return;
    message.success(shouldPromptContinue ? "Cấu hình đã lưu, hãy tiếp tục yêu cầu" : "Cấu hình đã lưu");
    clearPromptContinue();
  };

  const refreshModels = async () => {
    if (!config.baseUrl.trim() || !config.apiKey.trim()) {
      message.error("Vui lòng điền Base URL và API Key trước");
      return;
    }
    setLoadingModels(true);
    try {
      const models = await fetchImageModels(config);
      updateConfig("models", models);
      if (models.length && !models.includes(config.imageModel)) updateConfig("imageModel", models[0]);
      if (models.length && !models.includes(config.textModel)) updateConfig("textModel", models[0]);
      message.success("Đã cập nhật danh sách mô hình");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể tải danh sách mô hình");
    } finally {
      setLoadingModels(false);
    }
  };

  return (
    <Modal
      title={<div><div className="text-lg font-semibold">Cấu hình</div><div className="mt-1 text-xs font-normal text-stone-500">Mô hình và khóa API</div></div>}
      open={isConfigOpen}
      width={760}
      centered
      onCancel={() => setConfigDialogOpen(false)}
      footer={<Button type="primary" onClick={finishConfig}>Hoàn tất</Button>}
    >
      <div className="pt-1">
        <Form layout="vertical" requiredMark={false}>
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item label="Base URL" className="mb-4">
              <Input value={config.baseUrl} readOnly disabled />
            </Form.Item>
            <Form.Item label="API Key" className="mb-4">
              <Input.Password value={config.apiKey} onChange={(event) => updateConfig("apiKey", event.target.value)} />
            </Form.Item>
          </div>
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-stone-200 px-3 py-2 dark:border-stone-800">
            <div className="min-w-0">
              <div className="text-sm font-medium">Danh sách mô hình</div>
              <div className="mt-1 text-xs text-stone-500">Đã lưu {config.models.length} mô hình</div>
            </div>
            <Button size="small" loading={loadingModels} onClick={() => void refreshModels()}>Tải danh sách mô hình</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item label="Mô hình tạo ảnh mặc định" className="mb-4">
              <ModelPicker config={config} value={config.imageModel} onChange={(model) => updateConfig("imageModel", model)} fullWidth />
            </Form.Item>
            <Form.Item label="Mô hình văn bản mặc định" className="mb-4">
              <ModelPicker config={config} value={config.textModel} onChange={(model) => updateConfig("textModel", model)} fullWidth />
            </Form.Item>
          </div>
          <Form.Item label="System Prompt" className="mb-0">
            <Input.TextArea rows={3} value={config.systemPrompt} placeholder="Ví dụ: Bạn là một đạo diễn hình ảnh chuyên về nhiếp ảnh điện ảnh." onChange={(event) => updateConfig("systemPrompt", event.target.value)} />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
