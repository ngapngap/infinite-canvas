"use client";

import { Copy, Download, PencilLine, Search, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { App, Button, Card, Drawer, Empty, Form, Image, Input, Modal, Pagination, Select, Space, Tag, Typography } from "antd";

import { useCopyText } from "@/hooks/use-copy-text";
import { formatBytes, readFileAsDataUrl } from "@/lib/image-utils";
import { uploadImage } from "@/services/image-storage";
import { cn } from "@/lib/utils";
import { useAssetStore, type Asset, type AssetKind, type ImageAsset } from "@/stores/use-asset-store";

type AssetFormValues = {
  kind: AssetKind;
  title: string;
  coverUrl: string;
  tags: string[];
  source?: string;
  note?: string;
  content?: string;
};

type ImageDraft = ImageAsset["data"] | null;

const kindOptions = [
  { label: "Tất cả", value: "all" },
  { label: "Văn bản", value: "text" },
  { label: "Hình ảnh", value: "image" },
];

export default function AssetsPage() {
  const { message } = App.useApp();
  const copyText = useCopyText();
  const [form] = Form.useForm<AssetFormValues>();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const assets = useAssetStore((state) => state.assets);
  const addAsset = useAssetStore((state) => state.addAsset);
  const updateAsset = useAssetStore((state) => state.updateAsset);
  const removeAsset = useAssetStore((state) => state.removeAsset);
  const [keyword, setKeyword] = useState("");
  const [kindFilter, setKindFilter] = useState<AssetKind | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isAssetOpen, setIsAssetOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [formKind, setFormKind] = useState<AssetKind>("text");
  const [imageDraft, setImageDraft] = useState<ImageDraft>(null);
  const coverUrl = Form.useWatch("coverUrl", form) || "";
  const title = Form.useWatch("title", form) || "";
  const tags = Form.useWatch("tags", form) || [];
  const content = Form.useWatch("content", form) || "";
  const validAssets = useMemo(() => assets.filter((asset) => asset.kind === "text" || asset.kind === "image"), [assets]);

  const filteredAssets = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return validAssets.filter((asset) => {
      if (kindFilter !== "all" && asset.kind !== kindFilter) return false;
      if (!query) return true;
      return assetSearchText(asset).includes(query);
    });
  }, [validAssets, keyword, kindFilter]);

  const visibleAssets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAssets.slice(start, start + pageSize);
  }, [filteredAssets, page, pageSize]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredAssets.length / pageSize));
    setPage((value) => Math.min(value, maxPage));
  }, [filteredAssets.length, pageSize]);

  const openCreate = () => {
    setEditingAsset(null);
    setImageDraft(null);
    setFormKind("text");
    form.setFieldsValue({ kind: "text", title: "", coverUrl: "", tags: [], source: "Thêm thủ công", note: "", content: "" });
    setIsAssetOpen(true);
  };

  const openEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormKind(asset.kind);
    setImageDraft(asset.kind === "image" ? asset.data : null);
    form.setFieldsValue({
      kind: asset.kind,
      title: asset.title,
      coverUrl: asset.coverUrl,
      tags: asset.tags || [],
      source: asset.source,
      note: asset.note,
      content: asset.kind === "text" ? asset.data.content : "",
    });
    setIsAssetOpen(true);
  };

  const saveAsset = async () => {
    const values = await form.validateFields();
    const base = {
      title: values.title.trim(),
      coverUrl: values.coverUrl?.trim() || (values.kind === "image" && imageDraft ? imageDraft.dataUrl : ""),
      tags: values.tags || [],
      source: values.source?.trim(),
      note: values.note?.trim(),
      metadata: editingAsset?.metadata || { source: "manual" },
    };

    if (values.kind === "text") {
      const asset = { ...base, kind: "text" as const, data: { content: (values.content || "").trim() } };
      editingAsset ? updateAsset(editingAsset.id, asset) : addAsset(asset);
    } else {
      if (!imageDraft) {
        message.error("Vui lòng chọn file ảnh");
        return;
      }
      const asset = { ...base, kind: "image" as const, data: imageDraft };
      editingAsset ? updateAsset(editingAsset.id, asset) : addAsset(asset);
    }

    message.success(editingAsset ? "Đã cập nhật tài nguyên" : "Đã lưu tài nguyên");
    setIsAssetOpen(false);
  };

  const readCoverFile = async (file?: File) => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    form.setFieldValue("coverUrl", dataUrl);
  };

  const readImageFile = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const image = await uploadImage(file);
    const draft = { dataUrl: image.url, storageKey: image.storageKey, width: image.width, height: image.height, bytes: image.bytes, mimeType: image.mimeType };
    setImageDraft(draft);
    if (!form.getFieldValue("coverUrl")) form.setFieldValue("coverUrl", draft.dataUrl);
    if (!form.getFieldValue("title")) form.setFieldValue("title", file.name);
  };

  const copyAssetText = async (asset: Asset) => {
    if (asset.kind !== "text") return;
    copyText(asset.data.content, "Đã sao chép văn bản");
  };

  const downloadImage = (asset: Asset) => {
    if (asset.kind !== "image") return;
    const link = document.createElement("a");
    link.href = asset.data.dataUrl;
    link.download = `${asset.title || "asset"}.${asset.data.mimeType.split("/")[1] || "png"}`;
    link.click();
  };

  const confirmDelete = () => {
    if (!deletingAsset) return;
    removeAsset(deletingAsset.id);
    message.success("Đã xóa tài nguyên");
    setDeletingAsset(null);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background text-stone-900 dark:text-stone-100">
      <main className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] px-6 py-8 [background-size:16px_16px] dark:bg-[radial-gradient(rgba(245,245,244,.14)_1px,transparent_1px)]">
        <div className="pb-8">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-stone-950 dark:text-stone-100">Tài nguyên của tôi</h1>
            <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">Lưu trữ văn bản và hình ảnh thường dùng, tìm kiếm nhanh theo loại, tiêu đề và thẻ.</p>
          </div>

          <div className="mx-auto mt-8 w-full max-w-2xl">
            <Input.Search className="w-full" size="large" allowClear prefix={<Search className="size-4 text-stone-400" />} value={keyword} placeholder="Tìm tiêu đề, nội dung, thẻ hoặc nguồn" onChange={(event) => { setPage(1); setKeyword(event.target.value); }} onSearch={(value) => { setPage(1); setKeyword(value); }} />
          </div>

          <div className="mx-auto mt-6 grid max-w-6xl gap-3 text-left">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid gap-2 sm:grid-cols-[56px_minmax(0,1fr)] sm:items-center">
                <div className="text-xs font-medium text-stone-500 dark:text-stone-400">Loại</div>
                <div className="flex flex-wrap gap-2">
                  {kindOptions.map((option) => (
                    <Tag.CheckableTag key={option.value} checked={kindFilter === option.value} className={cn("prompt-filter-tag", kindFilter === option.value && "is-active")} onChange={() => { setPage(1); setKindFilter(option.value as AssetKind | "all"); }}>
                      {option.label}
                    </Tag.CheckableTag>
                  ))}
                </div>
              </div>
              <button type="button" className="cursor-pointer self-start text-sm font-medium text-stone-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline sm:self-center dark:text-stone-300" onClick={openCreate}>
                Thêm tài nguyên
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onOpen={() => setPreviewAsset(asset)}
                onEdit={() => openEdit(asset)}
                onCopy={copyAssetText}
                onDownload={downloadImage}
                onDelete={() => setDeletingAsset(asset)}
              />
            ))}
          </div>

          {!visibleAssets.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không tìm thấy tài nguyên" className="py-20" /> : null}

          <div className="flex justify-center">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={filteredAssets.length}
              showSizeChanger
              pageSizeOptions={[10, 20, 50, 100]}
              onChange={(nextPage, nextPageSize) => {
                setPage(nextPage);
                setPageSize(nextPageSize);
              }}
            />
          </div>
        </div>
      </main>

      <Modal title={editingAsset ? "Sửa tài nguyên" : "Thêm tài nguyên"} open={isAssetOpen} width={980} onCancel={() => setIsAssetOpen(false)} onOk={() => void saveAsset()} okText="Lưu" cancelText="Hủy" destroyOnHidden>
        <div className="grid gap-6 pt-1 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Form form={form} layout="vertical" requiredMark={false} initialValues={{ kind: "text", tags: [] }}>
            <Form.Item name="kind" label="Loại">
              <Select options={[{ label: "Văn bản", value: "text" }, { label: "Hình ảnh", value: "image" }]} onChange={(value) => setFormKind(value)} />
            </Form.Item>
            <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}>
              <Input size="large" placeholder="Đặt tên dễ tìm kiếm cho tài nguyên" />
            </Form.Item>
            <Form.Item name="coverUrl" label="URL ảnh bìa">
              <Space.Compact className="w-full">
                <Input placeholder="Có thể dán URL ảnh hoặc tải lên ảnh bìa" />
                <Button icon={<Upload className="size-3.5" />} onClick={() => coverInputRef.current?.click()}>Tải lên</Button>
              </Space.Compact>
            </Form.Item>
            <Form.Item name="tags" label="Thẻ">
              <Select mode="tags" tokenSeparators={[",", "，"]} placeholder="Nhập thẻ rồi nhấn Enter" />
            </Form.Item>
            <div className="grid gap-4 sm:grid-cols-2">
              <Form.Item name="source" label="Nguồn">
                <Input placeholder="Thêm thủ công / Canvas / Thư viện Prompt" />
              </Form.Item>
              <Form.Item name="note" label="Ghi chú">
                <Input placeholder="Tùy chọn" />
              </Form.Item>
            </div>
            {formKind === "text" ? (
              <Form.Item name="content" label="Nội dung văn bản" rules={[{ required: true, message: "Vui lòng nhập nội dung văn bản" }]}>
                <Input.TextArea rows={8} placeholder="Lưu prompt, mô tả, tài liệu tham khảo và các tài nguyên văn bản khác" />
              </Form.Item>
            ) : (
              <Form.Item label="Nội dung hình ảnh" required>
                <div className="rounded-lg border border-dashed border-stone-300 p-4 dark:border-stone-700">
                  <Button icon={<Upload className="size-4" />} onClick={() => imageInputRef.current?.click()}>Chọn file ảnh</Button>
                  {imageDraft ? <Typography.Text type="secondary" className="ml-3 text-xs">{imageDraft.width}x{imageDraft.height} · {formatBytes(imageDraft.bytes)}</Typography.Text> : <Typography.Text type="secondary" className="ml-3 text-xs">Chưa chọn ảnh</Typography.Text>}
                </div>
              </Form.Item>
            )}
          </Form>
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
            <Typography.Text strong>Xem trước</Typography.Text>
            <div className="mt-3 overflow-hidden rounded-lg border border-stone-200 bg-background dark:border-stone-800">
              {coverUrl || imageDraft?.dataUrl ? <img src={coverUrl || imageDraft?.dataUrl} alt="" className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-stone-100 p-5 text-center text-sm text-stone-500 dark:bg-stone-900">{content || "Chưa có ảnh bìa"}</div>}
              <div className="p-4">
                <Typography.Text strong ellipsis className="block">{title || "Tài nguyên chưa đặt tên"}</Typography.Text>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.length ? tags.map((tag) => <Tag key={tag} className="m-0">{tag}</Tag>) : <Tag className="m-0">Chưa gắn thẻ</Tag>}
                </div>
              </div>
            </div>
          </div>
        </div>
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => {
          void readCoverFile(event.target.files?.[0]);
          event.target.value = "";
        }} />
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => {
          void readImageFile(event.target.files?.[0]);
          event.target.value = "";
        }} />
      </Modal>

      <AssetDrawer asset={previewAsset} onClose={() => setPreviewAsset(null)} onCopy={copyAssetText} onDownload={downloadImage} />

      <Modal title="Xóa tài nguyên" open={Boolean(deletingAsset)} onCancel={() => setDeletingAsset(null)} onOk={confirmDelete} okText="Xóa" okButtonProps={{ danger: true }} cancelText="Hủy">
        Bạn có chắc muốn xóa「{deletingAsset?.title}」? Tài nguyên sẽ bị xóa khỏi danh sách.
      </Modal>
    </div>
  );
}

function AssetCard({ asset, onOpen, onEdit, onCopy, onDownload, onDelete }: { asset: Asset; onOpen: () => void; onEdit: () => void; onCopy: (asset: Asset) => void; onDownload: (asset: Asset) => void; onDelete: () => void }) {
  const cover = asset.coverUrl || (asset.kind === "image" ? asset.data.dataUrl : "");
  const summary = assetSummary(asset);
  return (
    <Card
      hoverable
      className="overflow-hidden"
      styles={{ body: { padding: 0 } }}
      cover={
        <button type="button" className="block w-full text-left" onClick={onOpen}>
          {cover ? <img src={cover} alt={asset.title} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-stone-100 p-5 text-center text-sm leading-6 text-stone-600 dark:bg-stone-900 dark:text-stone-300">{asset.kind === "text" ? asset.data.content : "Chưa có ảnh bìa"}</div>}
        </button>
      }
    >
      <button type="button" className="block w-full text-left" onClick={onOpen}>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="line-clamp-1 text-sm font-semibold text-stone-950 dark:text-stone-100">{asset.title}</h2>
              <Typography.Text type="secondary" className="mt-1 block text-xs">{asset.source || "Chưa ghi nguồn"}</Typography.Text>
            </div>
            <Tag className="m-0 shrink-0 text-[11px]">{asset.kind === "image" ? "Hình ảnh" : "Văn bản"}</Tag>
          </div>
          <Typography.Paragraph type="secondary" ellipsis={{ rows: 3 }} className="!mb-0 !mt-2 !text-xs !leading-5">
            {summary}
          </Typography.Paragraph>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(asset.tags || []).slice(0, 3).map((tag) => <Tag key={tag} className="m-0 text-[11px]">{tag}</Tag>)}
            {!asset.tags?.length ? <Tag className="m-0 text-[11px]">Không có thẻ</Tag> : null}
          </div>
        </div>
      </button>
      <div className="flex items-center gap-2 px-4 pb-4">
        <Button size="small" onClick={onOpen}>Xem</Button>
        <Button size="small" icon={<PencilLine className="size-3.5" />} onClick={onEdit}>Sửa</Button>
        {asset.kind === "text" ? <Button size="small" icon={<Copy className="size-3.5" />} onClick={() => void onCopy(asset)}>Sao chép</Button> : null}
        {asset.kind === "image" ? <Button size="small" icon={<Download className="size-3.5" />} onClick={() => onDownload(asset)}>Tải xuống</Button> : null}
        <Button size="small" danger icon={<Trash2 className="size-3.5" />} onClick={onDelete}>Xóa</Button>
      </div>
    </Card>
  );
}

function AssetDrawer({ asset, onClose, onCopy, onDownload }: { asset: Asset | null; onClose: () => void; onCopy: (asset: Asset) => void; onDownload: (asset: Asset) => void }) {
  const cover = asset ? asset.coverUrl || (asset.kind === "image" ? asset.data.dataUrl : "") : "";
  return (
    <Drawer title="Chi tiết tài nguyên" open={Boolean(asset)} size="large" onClose={onClose}>
      {asset ? (
        <div className="space-y-5">
          {cover ? <Image src={cover} alt={asset.title} className="rounded-lg" /> : <div className="rounded-lg border border-stone-200 bg-stone-50 p-5 text-sm leading-6 text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">{asset.kind === "text" ? asset.data.content : "Chưa có ảnh bìa"}</div>}
          <div>
            <Typography.Title level={4} className="!mb-2">{asset.title}</Typography.Title>
            <Space size={[4, 4]} wrap>
              <Tag>{asset.kind === "image" ? "Hình ảnh" : "Văn bản"}</Tag>
              {(asset.tags || []).map((tag) => <Tag key={tag}>{tag}</Tag>)}
            </Space>
          </div>
          <div className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
            <Typography.Text type="secondary" className="block text-xs">Nội dung</Typography.Text>
            {asset.kind === "text" ? <Typography.Paragraph className="mt-2 whitespace-pre-wrap">{asset.data.content}</Typography.Paragraph> : <Typography.Text className="mt-2 block">{asset.data.width}x{asset.data.height} · {formatBytes(asset.data.bytes)} · {asset.data.mimeType}</Typography.Text>}
          </div>
          {asset.note ? <div><Typography.Text type="secondary">Ghi chú</Typography.Text><Typography.Paragraph className="mt-1">{asset.note}</Typography.Paragraph></div> : null}
          <Space>
            {asset.kind === "text" ? <Button type="primary" icon={<Copy className="size-4" />} onClick={() => onCopy(asset)}>Sao chép văn bản</Button> : null}
            {asset.kind === "image" ? <Button type="primary" icon={<Download className="size-4" />} onClick={() => onDownload(asset)}>Tải ảnh</Button> : null}
          </Space>
        </div>
      ) : null}
    </Drawer>
  );
}

function assetSummary(asset: Asset) {
  if (asset.kind === "text") return asset.data.content;
  return `${asset.data.width}x${asset.data.height} · ${formatBytes(asset.data.bytes)} · ${asset.data.mimeType}`;
}

function assetSearchText(asset: Asset) {
  return [
    asset.title,
    asset.source || "",
    asset.note || "",
    (asset.tags || []).join(" "),
    asset.kind === "text" ? asset.data.content : asset.data.mimeType,
  ].join(" ").toLowerCase();
}
