"use client";

import { CopyOutlined, DeleteOutlined, EditOutlined, ExportOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, SyncOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Button, Card, Col, Flex, Form, Image, Input, Modal, Row, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import { useEffect, useState } from "react";

import { useCopyText } from "@/hooks/use-copy-text";
import type { Prompt } from "@/services/api/prompts";
import { useAdminPrompts } from "./use-admin-prompts";

export default function AdminPromptsPage() {
  const { categories, prompts, tags, keyword, category, tag, page, pageSize, total, isLoading, isSyncing, searchPrompts, changeCategory, changeTag, changePage, changePageSize, resetFilters, refreshPrompts, syncCategory, savePrompt: saveAdminPrompt, deletePrompt } = useAdminPrompts();
  const copyText = useCopyText();
  const [form] = Form.useForm<Partial<Prompt> & { tagText?: string }>();
  const [editingPrompt, setEditingPrompt] = useState<Partial<Prompt> | null>(null);
  const [detailPrompt, setDetailPrompt] = useState<Prompt | null>(null);
  const [deletingPrompt, setDeletingPrompt] = useState<Prompt | null>(null);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const defaultCategory = categories[0]?.category || "";
  const categoryName = (category: string) => categories.find((item) => item.category === category)?.name || category;
  const categoryOptions = [{ label: "Tất cả danh mục", value: "" }, ...categories.map((item) => ({ label: item.name, value: item.category }))];
  const tagOptions = tags.map((item) => ({ label: item, value: item }));

  useEffect(() => {
    if (editingPrompt) form.setFieldsValue({ ...editingPrompt, tagText: editingPrompt.tags?.join(", ") || "" });
  }, [editingPrompt, form]);

  const savePrompt = async () => {
    const value = await form.validateFields();
    await saveAdminPrompt({ ...editingPrompt, ...value, category: value.category || defaultCategory, tags: (value.tagText || "").split(",").map((item) => item.trim()).filter(Boolean) });
    setEditingPrompt(null);
  };

  const columns: ProColumns<Prompt>[] = [
    {
      title: "Ảnh bìa",
      dataIndex: "coverUrl",
      width: 88,
      render: (_, item) => <Image src={item.coverUrl || "/logo.svg"} alt={item.title} width={56} height={42} style={{ objectFit: "cover", borderRadius: 6 }} preview={{ mask: "Phóng to" }} fallback="/logo.svg" />,
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      width: 260,
      render: (_, item) => <Typography.Link strong ellipsis style={{ maxWidth: 260, display: "block" }} onClick={() => setDetailPrompt(item)}>{item.title}</Typography.Link>,
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      width: 150,
      render: (_, item) => <Typography.Text type="secondary">{categoryName(item.category)}</Typography.Text>,
    },
    {
      title: "Thẻ",
      dataIndex: "tags",
      width: 180,
      render: (_, item) => <Space size={[4, 4]} wrap>{(item.tags || []).slice(0, 3).map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space>,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 112,
      align: "right",
      render: (_, item) => (
        <Space size={4}>
          <Tooltip title="Chi tiết"><Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setDetailPrompt(item)} /></Tooltip>
          <Tooltip title="Sửa"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => setEditingPrompt(item)} /></Tooltip>
          <Tooltip title="Xóa"><Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={() => setDeletingPrompt(item)} /></Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <main style={{ padding: 24 }}>
      <Flex vertical gap={16}>
        <Card variant="borderless">
          <Form layout="vertical">
            <Row gutter={16} align="bottom">
              <Col flex="360px"><Form.Item label="Từ khóa"><Input.Search value={keyword} placeholder="Tìm tiêu đề hoặc prompt" allowClear enterButton={<SearchOutlined />} onSearch={searchPrompts} onChange={(event) => searchPrompts(event.target.value)} /></Form.Item></Col>
              <Col flex="220px"><Form.Item label="Nhóm"><Select value={category} onChange={changeCategory} options={categoryOptions} /></Form.Item></Col>
              <Col flex="220px"><Form.Item label="Thẻ"><Select mode="multiple" allowClear maxTagCount="responsive" value={tag} onChange={changeTag} options={tagOptions} placeholder="Tất cả thẻ" /></Form.Item></Col>
              <Col flex="none"><Form.Item><Space><Button onClick={resetFilters}>Đặt lại</Button><Button type="primary" icon={<ReloadOutlined />} onClick={refreshPrompts}>Tìm kiếm</Button></Space></Form.Item></Col>
            </Row>
          </Form>
        </Card>
        <ProTable<Prompt>
          rowKey="id"
          columns={columns}
          dataSource={prompts}
          loading={isLoading}
          search={false}
          defaultSize="middle"
          tableLayout="fixed"
          cardProps={{ variant: "borderless" }}
          headerTitle={<Space><Typography.Text strong>Danh sách Prompt</Typography.Text><Tag>{total} mục</Tag></Space>}
          options={{ density: true, setting: true, reload: () => void refreshPrompts() }}
          toolBarRender={() => [<Button key="sync" icon={<SyncOutlined />} onClick={() => setIsSyncOpen(true)}>Đồng bộ</Button>, <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setEditingPrompt({ category: defaultCategory, tags: [] })}>Thêm mới</Button>]}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (value) => `Tổng ${value} mục`, onChange: (nextPage, nextPageSize) => nextPageSize !== pageSize ? changePageSize(nextPageSize) : changePage(nextPage) }}
        />
      </Flex>

      <Modal title={editingPrompt?.id ? "Sửa prompt" : "Thêm prompt"} open={Boolean(editingPrompt)} width={720} onCancel={() => setEditingPrompt(null)} onOk={() => void savePrompt()} okText="Lưu" cancelText="Hủy" destroyOnHidden>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}><Input /></Form.Item>
          <Form.Item name="category" label="Danh mục"><Select options={categories.map((item) => ({ label: item.name, value: item.category }))} /></Form.Item>
          <Form.Item name="coverUrl" label="URL ảnh bìa"><Input /></Form.Item>
          <Form.Item name="tagText" label="Thẻ, phân cách bằng dấu phẩy"><Input /></Form.Item>
          <Form.Item name="prompt" label="Prompt" rules={[{ required: true, message: "Vui lòng nhập prompt" }]}><Input.TextArea rows={6} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Chi tiết Prompt" open={Boolean(detailPrompt)} width={760} onCancel={() => setDetailPrompt(null)} footer={<Button onClick={() => setDetailPrompt(null)}>Đóng</Button>}>
        {detailPrompt ? (
          <Flex vertical gap={14}>
            <Flex gap={14} align="start">
              <Image src={detailPrompt.coverUrl || "/logo.svg"} alt={detailPrompt.title} width={116} height={84} style={{ objectFit: "cover", borderRadius: 8 }} preview={{ mask: "Phóng to" }} fallback="/logo.svg" />
              <Flex vertical gap={8} style={{ minWidth: 0 }}>
                <Typography.Title level={5} style={{ margin: 0 }}>{detailPrompt.title}</Typography.Title>
                <Space wrap><Tag>{categoryName(detailPrompt.category)}</Tag>{(detailPrompt.tags || []).map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space>
              </Flex>
            </Flex>
            {detailPrompt.preview ? <Typography.Paragraph type="secondary" style={{ margin: 0 }}>{detailPrompt.preview}</Typography.Paragraph> : null}
            <Input.TextArea value={detailPrompt.prompt} rows={8} readOnly />
            <Space>
              <Button icon={<CopyOutlined />} onClick={() => copyText(detailPrompt.prompt)}>Sao chép prompt</Button>
              {detailPrompt.githubUrl ? <Button icon={<ExportOutlined />} href={detailPrompt.githubUrl} target="_blank">Nguồn từ xa</Button> : null}
            </Space>
          </Flex>
        ) : null}
      </Modal>

      <Modal title="Đồng bộ nguồn prompt từ xa" open={isSyncOpen} width={640} onCancel={() => !isSyncing && setIsSyncOpen(false)} mask={{ closable: !isSyncing }} footer={<Button disabled={isSyncing} onClick={() => setIsSyncOpen(false)}>Hủy</Button>}>
        <Table
          rowKey="category"
          dataSource={categories.filter((item) => item.remote)}
          pagination={false}
          columns={[
            { title: "Nguồn từ xa", dataIndex: "name", render: (_, item) => <Flex align="center" gap={8}>{item.name}{item.githubUrl ? <Typography.Link href={item.githubUrl} target="_blank"><ExportOutlined /></Typography.Link> : null}</Flex> },
            { title: "", key: "sync", width: 96, align: "right", render: (_, item) => <Button type="primary" loading={isSyncing} onClick={async () => { try { await syncCategory(item.category); setIsSyncOpen(false); } catch {} }}>Đồng bộ</Button> },
          ]}
        />
      </Modal>

      <Modal title="Xóa prompt" open={Boolean(deletingPrompt)} onCancel={() => setDeletingPrompt(null)} onOk={async () => { if (!deletingPrompt) return; await deletePrompt(deletingPrompt.id); setDeletingPrompt(null); }} okText="Xóa" okButtonProps={{ danger: true }} cancelText="Hủy">
        Bạn có chắc muốn xóa「{deletingPrompt?.title}」? Prompt sẽ bị xóa khỏi danh mục hiện tại.
      </Modal>
    </main>
  );
}
