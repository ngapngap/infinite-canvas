"use client";

import { CopyOutlined, DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Button, Card, Col, Flex, Form, Image, Input, Modal, Row, Select, Space, Tag, Tooltip, Typography } from "antd";
import { useEffect, useState } from "react";

import { useCopyText } from "@/hooks/use-copy-text";
import type { AdminAsset } from "@/services/api/admin";
import { useAdminAssets } from "./use-admin-assets";

type AssetFormValues = Partial<AdminAsset> & { tagText?: string };

const typeOptions = [
  { label: "Tất cả loại", value: "" },
  { label: "Văn bản", value: "text" },
  { label: "Hình ảnh", value: "image" },
];

const editTypeOptions = typeOptions.slice(1);

export default function AdminAssetsPage() {
  const { assets, tags, keyword, kind, tag, page, pageSize, total, isLoading, searchAssets, changeKind, changeTag, changePage, changePageSize, resetFilters, refreshAssets, saveAsset: saveAdminAsset, deleteAsset } = useAdminAssets();
  const copyText = useCopyText();
  const [form] = Form.useForm<AssetFormValues>();
  const [editingAsset, setEditingAsset] = useState<Partial<AdminAsset> | null>(null);
  const [detailAsset, setDetailAsset] = useState<AdminAsset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<AdminAsset | null>(null);
  const formType = Form.useWatch("type", form) || editingAsset?.type || "text";
  const tagOptions = tags.map((item) => ({ label: item, value: item }));

  useEffect(() => {
    if (editingAsset) form.setFieldsValue({ ...editingAsset, tagText: editingAsset.tags?.join(", ") || "" });
  }, [editingAsset, form]);

  const saveAsset = async () => {
    const value = await form.validateFields();
    const nextType = value.type || "text";
    await saveAdminAsset({
      ...editingAsset,
      ...value,
      type: nextType,
      coverUrl: value.coverUrl || (nextType === "image" ? value.url : ""),
      tags: (value.tagText || "").split(",").map((item) => item.trim()).filter(Boolean),
    });
    setEditingAsset(null);
  };

  const columns: ProColumns<AdminAsset>[] = [
    {
      title: "Ảnh bìa",
      dataIndex: "coverUrl",
      width: 88,
      render: (_, item) => <Image src={item.coverUrl || item.url || "/logo.svg"} alt={item.title} width={56} height={42} style={{ objectFit: "cover", borderRadius: 6 }} preview={{ mask: "Phóng to" }} fallback="/logo.svg" />,
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      width: 260,
      render: (_, item) => <Typography.Link strong ellipsis style={{ maxWidth: 260, display: "block" }} onClick={() => setDetailAsset(item)}>{item.title}</Typography.Link>,
    },
    {
      title: "Loại",
      dataIndex: "type",
      width: 84,
      render: (_, item) => <Tag>{item.type === "image" ? "Hình ảnh" : "Văn bản"}</Tag>,
    },
    {
      title: "Thẻ",
      dataIndex: "tags",
      width: 180,
      render: (_, item) => <Space size={[4, 4]} wrap>{(item.tags || []).slice(0, 3).map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space>,
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      width: 120,
      render: (_, item) => <Typography.Text type="secondary">{item.category || "Chưa phân loại"}</Typography.Text>,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 112,
      align: "right",
      render: (_, item) => (
        <Space size={4}>
          <Tooltip title="Chi tiết"><Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setDetailAsset(item)} /></Tooltip>
          <Tooltip title="Sửa"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => setEditingAsset(item)} /></Tooltip>
          <Tooltip title="Xóa"><Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={() => setDeletingAsset(item)} /></Tooltip>
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
              <Col flex="360px"><Form.Item label="Từ khóa"><Input.Search value={keyword} placeholder="Tìm tiêu đề, nội dung hoặc thẻ" allowClear enterButton={<SearchOutlined />} onSearch={searchAssets} onChange={(event) => searchAssets(event.target.value)} /></Form.Item></Col>
              <Col flex="180px"><Form.Item label="Loại"><Select value={kind} onChange={changeKind} options={typeOptions} /></Form.Item></Col>
              <Col flex="220px"><Form.Item label="Thẻ"><Select mode="multiple" allowClear maxTagCount="responsive" value={tag} onChange={changeTag} options={tagOptions} placeholder="Tất cả thẻ" /></Form.Item></Col>
              <Col flex="none"><Form.Item><Space><Button onClick={resetFilters}>Đặt lại</Button><Button type="primary" icon={<ReloadOutlined />} onClick={refreshAssets}>Tìm kiếm</Button></Space></Form.Item></Col>
            </Row>
          </Form>
        </Card>
        <ProTable<AdminAsset>
          rowKey="id"
          columns={columns}
          dataSource={assets}
          loading={isLoading}
          search={false}
          defaultSize="middle"
          tableLayout="fixed"
          cardProps={{ variant: "borderless" }}
          headerTitle={<Space><Typography.Text strong>Danh sách tài nguyên</Typography.Text><Tag>{total} mục</Tag></Space>}
          options={{ density: true, setting: true, reload: () => void refreshAssets() }}
          toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setEditingAsset({ type: "text", tags: [] })}>Thêm mới</Button>]}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (value) => `Tổng ${value} mục`, onChange: (nextPage, nextPageSize) => nextPageSize !== pageSize ? changePageSize(nextPageSize) : changePage(nextPage) }}
        />
      </Flex>

      <Modal title={editingAsset?.id ? "Sửa tài nguyên" : "Thêm tài nguyên"} open={Boolean(editingAsset)} width={760} onCancel={() => setEditingAsset(null)} onOk={() => void saveAsset()} okText="Lưu" cancelText="Hủy" destroyOnHidden>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="type" label="Loại" rules={[{ required: true, message: "Vui lòng chọn loại" }]}><Select options={editTypeOptions} /></Form.Item>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}><Input /></Form.Item>
          <Form.Item name="coverUrl" label="URL ảnh bìa"><Input /></Form.Item>
          <Form.Item name="tagText" label="Thẻ, phân cách bằng dấu phẩy"><Input /></Form.Item>
          <Form.Item name="category" label="Danh mục"><Input /></Form.Item>
          <Form.Item name="description" label="Mô tả"><Input.TextArea rows={3} /></Form.Item>
          {formType === "image" ? <Form.Item name="url" label="URL hình ảnh" rules={[{ required: true, message: "Vui lòng nhập URL hình ảnh" }]}><Input /></Form.Item> : <Form.Item name="content" label="Nội dung văn bản" rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}><Input.TextArea rows={6} /></Form.Item>}
        </Form>
      </Modal>

      <Modal title="Chi tiết tài nguyên" open={Boolean(detailAsset)} width={760} onCancel={() => setDetailAsset(null)} footer={<Button onClick={() => setDetailAsset(null)}>Đóng</Button>}>
        {detailAsset ? (
          <Flex vertical gap={14}>
            <Flex gap={14} align="start">
              <Image src={detailAsset.coverUrl || detailAsset.url || "/logo.svg"} alt={detailAsset.title} width={116} height={84} style={{ objectFit: "cover", borderRadius: 8 }} preview={{ mask: "Phóng to" }} fallback="/logo.svg" />
              <Flex vertical gap={8} style={{ minWidth: 0 }}>
                <Typography.Title level={5} style={{ margin: 0 }}>{detailAsset.title}</Typography.Title>
                <Space wrap><Tag>{detailAsset.type === "image" ? "Hình ảnh" : "Văn bản"}</Tag>{detailAsset.category ? <Tag>{detailAsset.category}</Tag> : null}{(detailAsset.tags || []).map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space>
              </Flex>
            </Flex>
            {detailAsset.description ? <Typography.Paragraph type="secondary" style={{ margin: 0 }}>{detailAsset.description}</Typography.Paragraph> : null}
            <Input.TextArea value={detailAsset.type === "image" ? detailAsset.url || detailAsset.coverUrl : detailAsset.content} rows={7} readOnly />
            <Button icon={<CopyOutlined />} onClick={() => copyText(detailAsset.type === "image" ? detailAsset.url || detailAsset.coverUrl : detailAsset.content)}>Sao chép nội dung</Button>
          </Flex>
        ) : null}
      </Modal>

      <Modal title="Xóa tài nguyên" open={Boolean(deletingAsset)} onCancel={() => setDeletingAsset(null)} onOk={async () => { if (!deletingAsset) return; await deleteAsset(deletingAsset.id); setDeletingAsset(null); }} okText="Xóa" okButtonProps={{ danger: true }} cancelText="Hủy">
        Bạn có chắc muốn xóa「{deletingAsset?.title}」? Tài nguyên sẽ bị xóa khỏi thư viện.
      </Modal>
    </main>
  );
}
