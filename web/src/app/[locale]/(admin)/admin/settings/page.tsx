"use client";

import { CheckCircleOutlined, DeleteOutlined, FormatPainterOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { json } from "@codemirror/lang-json";
import { Alert, App, Button, Card, Col, Drawer, Flex, Form, Input, InputNumber, Modal, Row, Segmented, Select, Space, Switch, Table, Tabs, Tag, Typography } from "antd";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { EditorView } from "@uiw/react-codemirror";

import { fetchAdminSettings, fetchChannelModels, saveAdminSettings, testChannelModel, type AdminModelChannel, type AdminSettings } from "@/services/api/admin";
import { useUserStore } from "@/stores/use-user-store";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });
const jsonEditorTheme = EditorView.theme({
  "&": { backgroundColor: "var(--ant-color-bg-container)", color: "var(--ant-color-text)" },
  ".cm-content": { caretColor: "var(--ant-color-text)", padding: "12px 0" },
  ".cm-line": { padding: "0 18px" },
  ".cm-gutters": { backgroundColor: "var(--ant-color-fill-quaternary)", borderRight: "1px solid var(--ant-color-border)", color: "var(--ant-color-text-tertiary)" },
  ".cm-activeLine": { backgroundColor: "var(--ant-color-fill-quaternary)" },
  ".cm-activeLineGutter": { backgroundColor: "var(--ant-color-fill-quaternary)", color: "var(--ant-color-text)" },
  ".cm-cursor": { borderLeftColor: "var(--ant-color-text)" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { backgroundColor: "var(--ant-control-item-bg-active)" },
  ".cm-foldPlaceholder": { backgroundColor: "var(--ant-color-fill-quaternary)", border: "1px solid var(--ant-color-border)", color: "var(--ant-color-text-tertiary)" },
  "&.cm-focused": { outline: "none" },
});

const emptySettings: AdminSettings = {
  public: {
    modelChannel: {
      availableModels: [],
      defaultModel: "",
      defaultImageModel: "",
      defaultTextModel: "",
      systemPrompt: "",
      allowCustomChannel: true,
    },
  },
  private: { channels: [] },
};
const emptyChannel: AdminModelChannel = { protocol: "openai", name: "", baseUrl: "", apiKey: "", models: [], weight: 1, enabled: true, remark: "" };

type SettingsTabKey = "public" | "private";
type EditorMode = "visual" | "json";

export default function AdminSettingsPage() {
  const token = useUserStore((state) => state.token);
  const { message } = App.useApp();
  const [form] = Form.useForm<AdminSettings>();
  const [activeTab, setActiveTab] = useState<SettingsTabKey>("public");
  const [editorMode, setEditorMode] = useState<Record<SettingsTabKey, EditorMode>>({ public: "visual", private: "visual" });
  const [jsonText, setJsonText] = useState<Record<SettingsTabKey, string>>({ public: "", private: "" });
  const [channels, setChannels] = useState<AdminModelChannel[]>([]);
  const [channelForm] = Form.useForm<AdminModelChannel>();
  const [editingChannelIndex, setEditingChannelIndex] = useState<number | null>(null);
  const [isChannelDrawerOpen, setIsChannelDrawerOpen] = useState(false);
  const [testChannelIndex, setTestChannelIndex] = useState<number | null>(null);
  const [testKeyword, setTestKeyword] = useState("");
  const [selectedTestModels, setSelectedTestModels] = useState<string[]>([]);
  const [testingModels, setTestingModels] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<Record<string, { status: "success" | "error"; duration?: string; message: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const publicModels = Form.useWatch(["public", "modelChannel", "availableModels"], form) || [];
  const channelModels = useMemo(() => collectChannelModels(channels), [channels]);
  const modelOptions = useMemo(() => uniqueModels([...publicModels, ...channelModels]), [publicModels, channelModels]);
  const activeMode = editorMode[activeTab];
  const activeJsonText = jsonText[activeTab];
  const jsonError = activeMode === "json" ? getJsonError(activeJsonText) : "";

  const loadSettings = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = normalizeSettings(await fetchAdminSettings(token));
      form.setFieldsValue(data);
      setChannels(data.private.channels);
      setJsonText({
        public: JSON.stringify(data.public, null, 2),
        private: JSON.stringify(data.private, null, 2),
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể tải cài đặt");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, [token]);

  const changeTab = (nextTab: SettingsTabKey) => {
    setActiveTab(nextTab);
  };

  const saveSettings = async () => {
    if (!token) return;
    const values = await collectSettings(form, editorMode, jsonText, message);
    if (!values) {
      return;
    }
    setIsSaving(true);
    try {
      const saved = normalizeSettings(await saveAdminSettings(token, values));
      form.setFieldsValue(saved);
      setChannels(saved.private.channels);
      setJsonText({
        public: JSON.stringify(saved.public, null, 2),
        private: JSON.stringify(saved.private, null, 2),
      });
      message.success("Đã lưu");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Lưu thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMode = (tab: SettingsTabKey, nextMode: EditorMode) => {
    if (nextMode === "json") {
      setJsonText((current) => ({
        ...current,
        [tab]: JSON.stringify(tab === "public" ? normalizePublicSetting(form.getFieldValue(["public"]) as Partial<AdminSettings["public"]>) : normalizePrivateSetting(form.getFieldValue(["private"]) as Partial<AdminSettings["private"]>), null, 2),
      }));
      setEditorMode((current) => ({ ...current, [tab]: nextMode }));
      return;
    }
    const parsed = parseTabJson(tab, jsonText[tab]);
    if (!parsed) {
      message.error("JSON không hợp lệ");
      return;
    }
    form.setFieldsValue({ [tab]: parsed } as Partial<AdminSettings>);
    if (tab === "private") setChannels((parsed as AdminSettings["private"]).channels);
    setEditorMode((current) => ({ ...current, [tab]: nextMode }));
  };

  const formatJson = (tab: SettingsTabKey) => {
    const parsed = parseTabJson(tab, jsonText[tab]);
    if (!parsed) {
      message.error("JSON không hợp lệ");
      return;
    }
    setJsonText((current) => ({
      ...current,
      [tab]: JSON.stringify(parsed, null, 2),
    }));
  };

  const openChannelDrawer = (index: number | null) => {
    setEditingChannelIndex(index);
    setIsChannelDrawerOpen(true);
    channelForm.setFieldsValue(index === null ? emptyChannel : normalizeChannel(channels[index]));
  };

  const closeChannelDrawer = () => {
    setIsChannelDrawerOpen(false);
    setEditingChannelIndex(null);
    channelForm.resetFields();
  };

  const saveChannel = async () => {
    const channel = normalizeChannel(await channelForm.validateFields());
    const nextChannels = [...channels];
    if (editingChannelIndex === null) nextChannels.push(channel);
    else nextChannels[editingChannelIndex] = channel;
    setChannels(nextChannels);
    form.setFieldValue(["private", "channels"], nextChannels);
    closeChannelDrawer();
  };

  const fetchChannelModelList = async () => {
    const channel = channelForm.getFieldsValue();
    if (!channel?.baseUrl || !channel?.apiKey) {
      message.warning("Vui lòng điền địa chỉ API và API Key trước");
      return;
    }
    try {
      const channelModels = await fetchChannelModels(channel);
      channelForm.setFieldValue("models", channelModels);
      message.success(`Đã lấy ${channelModels.length} mô hình`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể tải danh sách mô hình");
    }
  };

  const openTestDialog = (index: number) => {
    const channel = normalizeChannel(channels[index]);
    if (!channel.baseUrl || !channel.apiKey || channel.models.length === 0) {
      message.warning("Vui lòng điền địa chỉ API, API Key và ít nhất một mô hình");
      return;
    }
    setTestChannelIndex(index);
    setTestKeyword("");
    setSelectedTestModels([]);
    setTestingModels([]);
    setTestResults({});
  };

  const closeTestDialog = () => {
    setTestChannelIndex(null);
    setTestKeyword("");
    setSelectedTestModels([]);
    setTestingModels([]);
    setTestResults({});
  };

  const testModelOnline = async (model: string) => {
    if (testChannelIndex === null) return;
    const channel = normalizeChannel(channels[testChannelIndex]);
    setTestingModels((current) => [...current, model]);
    try {
      const startedAt = performance.now();
      const result = await testChannelModel(channel, model);
      setTestResults((current) => ({ ...current, [model]: { status: "success", duration: `${((performance.now() - startedAt) / 1000).toFixed(2)}s`, message: result } }));
    } catch (error) {
      setTestResults((current) => ({ ...current, [model]: { status: "error", message: error instanceof Error ? error.message : "Kiểm tra thất bại" } }));
    } finally {
      setTestingModels((current) => current.filter((item) => item !== model));
    }
  };

  const batchTestModels = async () => {
    for (const model of selectedTestModels) {
      await testModelOnline(model);
    }
  };

  const testChannel = testChannelIndex === null ? null : normalizeChannel(channels[testChannelIndex]);
  const testModels = (testChannel?.models || []).filter((model) => model.toLowerCase().includes(testKeyword.trim().toLowerCase()));

  return (
    <main style={{ padding: 24 }}>
      <Flex vertical gap={16}>
        <Card variant="borderless">
          <Flex justify="space-between" align="center" gap={16} wrap>
            <Tabs
              activeKey={activeTab}
              onChange={(key) => changeTab(key as SettingsTabKey)}
              items={[
                { key: "public", label: "Cấu hình công khai (hiển thị cho frontend)" },
                { key: "private", label: "Cấu hình riêng tư (không hiển thị)" },
              ]}
            />
            <Space>
              <Button icon={<ReloadOutlined />} loading={isLoading} onClick={() => void loadSettings()}>Làm mới</Button>
              <Button type="primary" icon={<SaveOutlined />} loading={isSaving} onClick={() => void saveSettings()}>Lưu cài đặt</Button>
            </Space>
          </Flex>
        </Card>

        <Card variant="borderless">
          <Flex justify="space-between" align="center" gap={16} wrap style={{ marginBottom: 16 }}>
            <Segmented
              value={activeMode}
              onChange={(value) => toggleMode(activeTab, value as EditorMode)}
              options={[{ label: "Chỉnh sửa trực quan", value: "visual" }, { label: "Chỉnh sửa JSON", value: "json" }]}
            />
            {activeMode === "json" ? (
              <Space>
                {jsonError ? <Tag color="error">{jsonError}</Tag> : <Tag color="success" icon={<CheckCircleOutlined />}>JSON hợp lệ</Tag>}
                <Button icon={<FormatPainterOutlined />} onClick={() => formatJson(activeTab)}>Định dạng</Button>
              </Space>
            ) : (
              <Typography.Text type="secondary">{activeTab === "public" ? "Các cài đặt này được hiển thị cho frontend" : "Các cài đặt này chỉ lưu ở backend"}</Typography.Text>
            )}
          </Flex>

          {activeTab === "public" ? (
            activeMode === "visual" ? (
              <Form form={form} layout="vertical" initialValues={emptySettings} requiredMark={false}>
                <Row gutter={16}>
                  <Col span={24}><Form.Item name={["public", "modelChannel", "availableModels"]} label="Mô hình khả dụng (cấu hình kênh trước)"><Select mode="tags" tokenSeparators={[",", "\n"]} options={modelOptions.map((item) => ({ label: item, value: item }))} /></Form.Item></Col>
                   <Col xs={24} md={8}><Form.Item name={["public", "modelChannel", "defaultModel"]} label="Mô hình mặc định"><Select showSearch allowClear options={publicModels.map((item) => ({ label: item, value: item }))} /></Form.Item></Col>
                   <Col xs={24} md={8}><Form.Item name={["public", "modelChannel", "defaultImageModel"]} label="Mô hình ảnh mặc định"><Select showSearch allowClear options={publicModels.map((item) => ({ label: item, value: item }))} /></Form.Item></Col>
                   <Col xs={24} md={8}><Form.Item name={["public", "modelChannel", "defaultTextModel"]} label="Mô hình văn bản mặc định"><Select showSearch allowClear options={publicModels.map((item) => ({ label: item, value: item }))} /></Form.Item></Col>
                   <Col span={24}><Form.Item name={["public", "modelChannel", "systemPrompt"]} label="System Prompt"><Input.TextArea rows={4} /></Form.Item></Col>
                   <Col span={24}><Form.Item name={["public", "modelChannel", "allowCustomChannel"]} label="Cho phép kênh tùy chỉnh" extra="Khi bật, người dùng có thể chọn giữa kênh backend và kết nối trực tiếp qua baseUrl tùy chỉnh" valuePropName="checked"><Switch /></Form.Item></Col>
                </Row>
              </Form>
            ) : (
              <div style={{ overflow: "hidden", border: "1px solid var(--ant-color-border)", borderRadius: 6 }}>
                <CodeMirror
                  value={activeJsonText}
                  height="520px"
                  extensions={[json(), jsonEditorTheme]}
                  basicSetup={{ foldGutter: true, lineNumbers: true, highlightActiveLine: true, highlightActiveLineGutter: true }}
                  theme="none"
                  onChange={(value) => setJsonText((current) => ({ ...current, public: value }))}
                  style={{ fontSize: 13 }}
                />
              </div>
            )
          ) : activeMode === "visual" ? (
            <Form form={form} layout="vertical" initialValues={emptySettings} requiredMark={false}>
              <Flex vertical gap={12}>
                <Alert
                  showIcon
                  type="warning"
                  message="Hiện chưa có hệ thống người dùng hoàn chỉnh. Tất cả người truy cập đều có thể sử dụng API kênh backend. Không nên triển khai công khai để tránh tiêu hao quota."
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openChannelDrawer(null)}>Thêm kênh</Button>
                <Table
                  rowKey={(_, index) => String(index)}
                  pagination={false}
                  dataSource={channels}
                  columns={[
                    { title: "Tên", dataIndex: "name", render: (value) => value || "Kênh chưa đặt tên" },
                    { title: "Giao thức", dataIndex: "protocol", width: 96, render: (value) => <Tag>{value || "openai"}</Tag> },
                    { title: "Trạng thái", dataIndex: "enabled", width: 96, render: (value) => <Tag color={value ? "success" : "default"}>{value ? "Đã bật" : "Đã tắt"}</Tag> },
                    { title: "Mô hình", dataIndex: "models", render: (value: string[]) => <Typography.Text ellipsis style={{ maxWidth: 360 }}>{modelSummary(value || [])}</Typography.Text> },
                    { title: "Trọng số", dataIndex: "weight", width: 88 },
                    {
                      title: "Thao tác",
                      key: "actions",
                      width: 220,
                      align: "right",
                      render: (_, __, index) => (
                        <Space size={4}>
                          <Button size="small" onClick={() => openTestDialog(index)}>Kiểm tra</Button>
                          <Button size="small" onClick={() => openChannelDrawer(index)}>Sửa</Button>
                          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => {
                            const nextChannels = [...channels];
                            nextChannels.splice(index, 1);
                            setChannels(nextChannels);
                            form.setFieldValue(["private", "channels"], nextChannels);
                          }} />
                        </Space>
                      ),
                    },
                  ]}
                />
              </Flex>
            </Form>
          ) : (
            <div style={{ overflow: "hidden", border: "1px solid var(--ant-color-border)", borderRadius: 6 }}>
              <CodeMirror
                value={activeJsonText}
                height="520px"
                extensions={[json(), jsonEditorTheme]}
                basicSetup={{ foldGutter: true, lineNumbers: true, highlightActiveLine: true, highlightActiveLineGutter: true }}
                theme="none"
                onChange={(value) => setJsonText((current) => ({ ...current, private: value }))}
                style={{ fontSize: 13 }}
              />
            </div>
          )}
        </Card>
        <Drawer title={editingChannelIndex === null ? "Thêm kênh" : "Sửa kênh"} open={isChannelDrawerOpen} size={560} onClose={closeChannelDrawer} extra={<Space><Button onClick={closeChannelDrawer}>Hủy</Button><Button type="primary" onClick={() => void saveChannel()}>Lưu</Button></Space>} destroyOnHidden>
          <Form form={channelForm} layout="vertical" requiredMark={false} initialValues={emptyChannel}>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="name" label="Tên kênh" rules={[{ required: true, message: "Vui lòng nhập tên kênh" }]}><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="protocol" label="Giao thức"><Select options={[{ label: "OpenAI", value: "openai" }]} /></Form.Item></Col>
              <Col span={12}><Form.Item name="weight" label="Trọng số"><InputNumber min={1} step={1} className="!w-full" /></Form.Item></Col>
              <Col span={12}><Form.Item name="enabled" label="Bật" valuePropName="checked"><Switch /></Form.Item></Col>
              <Col span={24}><Form.Item name="baseUrl" label="Địa chỉ API" rules={[{ required: true, message: "Vui lòng nhập địa chỉ API" }]}><Input /></Form.Item></Col>
              <Col span={24}><Form.Item name="apiKey" label="API Key" rules={[{ required: true, message: "Vui lòng nhập API Key" }]}><Input.Password /></Form.Item></Col>
              <Col span={24}>
                <Form.Item label="Mô hình của kênh">
                  <Space.Compact style={{ width: "100%" }}>
                    <Form.Item name="models" noStyle><Select mode="tags" tokenSeparators={[",", "\n"]} /></Form.Item>
                    <Button icon={<ReloadOutlined />} onClick={() => void fetchChannelModelList()}>Lấy danh sách mô hình</Button>
                  </Space.Compact>
                </Form.Item>
              </Col>
              <Col span={24}><Form.Item name="remark" label="Ghi chú"><Input.TextArea rows={3} /></Form.Item></Col>
            </Row>
          </Form>
        </Drawer>
        <Modal
          title={<Space>{testChannel?.name || "Kênh"} Kiểm tra mô hình kênh<Typography.Text type="secondary">Tổng {testChannel?.models.length || 0} mô hình</Typography.Text></Space>}
          open={testChannelIndex !== null}
          width={920}
          onCancel={closeTestDialog}
          footer={<Space><Button onClick={closeTestDialog}>Hủy</Button><Button type="primary" disabled={!selectedTestModels.length || testingModels.length > 0} onClick={() => void batchTestModels()}>Kiểm tra hàng loạt {selectedTestModels.length} mô hình</Button></Space>}
          destroyOnHidden
        >
          <Flex vertical gap={12}>
            <Typography.Text type="secondary">Kiểm tra sẽ gửi "hi" đến các mô hình đã chọn để xác nhận kênh có phản hồi.</Typography.Text>
            <Input.Search placeholder="Tìm mô hình..." allowClear value={testKeyword} onChange={(event) => setTestKeyword(event.target.value)} />
            <Table
              rowKey="model"
              pagination={false}
              scroll={{ y: 420 }}
              dataSource={testModels.map((model) => ({ model }))}
              rowSelection={{
                selectedRowKeys: selectedTestModels,
                onChange: (keys) => setSelectedTestModels(keys.map(String)),
              }}
              columns={[
                { title: "Tên mô hình", dataIndex: "model", render: (value) => <Typography.Text strong>{value}</Typography.Text> },
                {
                  title: "Trạng thái",
                  dataIndex: "model",
                  width: 260,
                  render: (value) => {
                    if (testingModels.includes(value)) return <Tag color="processing">Đang kiểm tra</Tag>;
                    const result = testResults[value];
                    if (!result) return <Tag>Chưa bắt đầu</Tag>;
                    return result.status === "success" ? (
                      <Space size={6} wrap>
                        <Tag color="success">Thành công</Tag>
                        <Typography.Text type="secondary">Thời gian: {result.duration}</Typography.Text>
                      </Space>
                    ) : (
                      <Typography.Text type="danger">{result.message}</Typography.Text>
                    );
                  },
                },
                {
                  title: "Thao tác",
                  key: "actions",
                  width: 120,
                  align: "right",
                  render: (_, item) => <Button size="small" loading={testingModels.includes(item.model)} onClick={() => void testModelOnline(item.model)}>Kiểm tra</Button>,
                },
              ]}
            />
          </Flex>
        </Modal>
      </Flex>
    </main>
  );
}

function normalizeSettings(settings: Partial<AdminSettings> = {}): AdminSettings {
  const privateSetting = normalizePrivateSetting(settings.private);
  return {
    public: {
      ...normalizePublicSetting(settings.public),
    },
    private: privateSetting,
  };
}

function normalizePublicSetting(setting: Partial<AdminSettings["public"]> = {}): AdminSettings["public"] {
  return {
    ...emptySettings.public,
    modelChannel: {
      ...emptySettings.public.modelChannel,
      ...(setting.modelChannel || {}),
      availableModels: setting.modelChannel?.availableModels || [],
    },
  };
}

function normalizePrivateSetting(setting: Partial<AdminSettings["private"]> = {}): AdminSettings["private"] {
  return {
    channels: (setting.channels || []).map(normalizeChannel),
  };
}

function normalizeChannel(item: Partial<AdminModelChannel> = {}): AdminModelChannel {
  return {
    protocol: "openai",
    name: item.name || "",
    baseUrl: item.baseUrl || "",
    apiKey: item.apiKey || "",
    models: item.models || [],
    weight: Math.max(1, Number(item.weight) || 1),
    enabled: item.enabled !== false,
    remark: item.remark || "",
  };
}

function collectChannelModels(channels: AdminModelChannel[]) {
  return uniqueModels(channels.filter((channel) => channel.enabled).flatMap((channel) => channel.models || []));
}

function uniqueModels(models: string[]) {
  return Array.from(new Set(models.filter(Boolean)));
}

function modelSummary(models: string[]) {
  if (!models.length) return "Chưa cấu hình mô hình";
  const preview = models.slice(0, 3).join(", ");
  return models.length > 3 ? `${models.length} mô hình: ${preview}...` : preview;
}

function parseTabJson(tab: "public", value: string): AdminSettings["public"] | null;
function parseTabJson(tab: "private", value: string): AdminSettings["private"] | null;
function parseTabJson(tab: SettingsTabKey, value: string): AdminSettings[SettingsTabKey] | null;
function parseTabJson(tab: SettingsTabKey, value: string): AdminSettings[SettingsTabKey] | null {
  try {
    return tab === "public" ? normalizePublicSetting(JSON.parse(value) as Partial<AdminSettings["public"]>) : normalizePrivateSetting(JSON.parse(value) as Partial<AdminSettings["private"]>);
  } catch {
    return null;
  }
}

async function collectSettings(form: any, editorMode: Record<SettingsTabKey, EditorMode>, jsonText: Record<SettingsTabKey, string>, message: { error: (value: string) => void }) {
  const values = normalizeSettings(form.getFieldsValue(true) as AdminSettings);
  if (editorMode.public === "json") {
    const publicSetting = parseTabJson("public", jsonText.public);
    if (!publicSetting) {
      message.error("Cấu hình công khai JSON không hợp lệ");
      return null;
    }
    values.public = publicSetting;
  }
  if (editorMode.private === "json") {
    const privateSetting = parseTabJson("private", jsonText.private);
    if (!privateSetting) {
      message.error("Cấu hình riêng tư JSON không hợp lệ");
      return null;
    }
    values.private = privateSetting;
  }
  return normalizeSettings(values);
}

function getJsonError(value: string) {
  try {
    JSON.parse(value);
    return "";
  } catch (error) {
    return error instanceof Error ? error.message : "JSON không hợp lệ";
  }
}
