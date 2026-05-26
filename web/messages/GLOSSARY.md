# Translation Glossary / Bảng thuật ngữ dịch thuật

Bảng này dùng làm tham chiếu cho người dịch, đảm bảo nhất quán thuật ngữ giữa các ngôn ngữ.

| zh-CN | English | Vietnamese | Ghi chú |
|-------|---------|------------|---------|
| 画布 | Canvas | Canvas | Giữ nguyên thuật ngữ kỹ thuật |
| 无限画布 | Infinite Canvas | Infinite Canvas | Tên sản phẩm, giữ nguyên |
| 素材 | Asset | Tài nguyên | |
| 素材库 | Asset Library | Thư viện tài nguyên | |
| 提示词 | Prompt | Prompt | Giữ nguyên thuật ngữ AI |
| 节点 | Node | Nút | Trong ngữ cảnh canvas |
| 渠道 | Channel | Kênh | Admin context, API channel |
| 撤销 | Undo | Hoàn tác | |
| 重做 | Redo | Làm lại | |
| 生图 | Image Generation | Tạo ảnh | |
| 宽高比 | Aspect Ratio | Tỷ lệ khung hình | |
| 质量 | Quality | Chất lượng | |
| 模型 | Model | Mô hình | AI model |
| 配置 | Settings / Config | Cấu hình | |
| 登录 | Login | Đăng nhập | |
| 删除 | Delete | Xóa | |
| 保存 | Save | Lưu | |
| 新建 | Create / New | Tạo mới | |
| 导入 | Import | Nhập | |
| 导出 | Export | Xuất | |
| 复制 | Duplicate / Copy | Nhân bản / Sao chép | Duplicate = nhân bản node, Copy = sao chép text |
| 刷新 | Refresh | Làm mới | |
| 加载中 | Loading | Đang tải | |
| 操作失败 | Operation failed | Thao tác thất bại | |
| 浅色 | Light | Sáng | Theme mode |
| 深色 | Dark | Tối | Theme mode |
| 网格 | Grid | Lưới | Canvas background |
| 对话 | Chat / Conversation | Cuộc trò chuyện | Assistant context |
| 历史记录 | History | Lịch sử | |
| 管理员 | Admin | Quản trị viên | |

## Nguyên tắc dịch

1. **Tên sản phẩm** (Infinite Canvas) giữ nguyên tiếng Anh ở mọi ngôn ngữ.
2. **Thuật ngữ AI** (Prompt, Model) giữ nguyên tiếng Anh trong bản tiếng Việt.
3. **Hành động UI** dịch ngắn gọn, ưu tiên 1-2 từ.
4. **Thông báo lỗi** dịch rõ ràng, cụ thể, không mơ hồ.
5. **Placeholder** mang tính gợi ý hành động cho người dùng.

## Overrides

- Vị trí file: `web/messages/<locale>-overrides/<namespace>.json` (ví dụ `vi-overrides/common.json`).
- Cơ chế: khi xử lý request, file override sẽ được deep-merge đè lên file gốc cùng namespace, key trùng thì override thắng.
- Mục đích: giữ tùy biến chuỗi của bản fork mà không sửa file gốc trong `messages/<locale>/`, để `git merge upstream/main` ít xung đột.
- Chỉ thêm những key thực sự muốn đổi; key thiếu sẽ tự fallback về bản upstream.
- File override không tồn tại là bình thường, không gây lỗi runtime.
