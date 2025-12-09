# Demo Ứng dụng Quản lý Tài liệu Kế toán - Kiểm toán

## 📋 Mô tả

Đây là một demo ứng dụng React để quản lý tài liệu kế toán - kiểm toán với các chức năng:
- Tạo, xem, sửa, xóa tài liệu
- Phân loại tài liệu theo 2 loại: Official (Nộp Nhà nước) và Internal (Nội bộ)
- Gán danh mục sản phẩm cho từng tài liệu
- Tìm kiếm và lọc tài liệu
- Dashboard với thống kê

## 🚀 Cài đặt và Chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Chạy ứng dụng
```bash
npm run dev
```

Ứng dụng sẽ chạy tại: `http://localhost:5173`

## 📁 Cấu trúc Project

```
my-project/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx          # Sidebar navigation
│   │   ├── DocumentForm.jsx      # Form tạo/sửa tài liệu
│   │   ├── DocumentList.jsx      # Danh sách tài liệu với filter
│   │   └── DocumentDetail.jsx   # Chi tiết tài liệu
│   ├── pages/
│   │   ├── Dashboard.jsx        # Trang dashboard
│   │   └── ProductCategories.jsx # Trang danh mục sản phẩm
│   ├── services/
│   │   └── api.js               # API service (localStorage)
│   ├── data/
│   │   └── productCategories.json # Danh sách danh mục
│   ├── App.jsx                  # Main app với routing
│   └── main.jsx                 # Entry point
├── public/
│   └── productCategories.json   # Danh mục sản phẩm (public)
└── package.json
```

## 🎯 Chức năng chính

### 1. Dashboard
- Hiển thị thống kê tổng quan
- Quick actions để tạo tài liệu mới

### 2. Documents
- **Danh sách**: Hiển thị tất cả tài liệu dạng bảng
- **Tạo mới**: Form với đầy đủ thông tin
- **Chi tiết**: Xem đầy đủ metadata của tài liệu
- **Sửa/Xóa**: Chỉnh sửa hoặc xóa tài liệu

### 3. Product Categories
- Hiển thị danh sách danh mục sản phẩm
- Thống kê số lượng tài liệu sử dụng mỗi danh mục

## 🔍 Filter và Search

### Filter theo Document Type
- All Types
- Official
- Internal

### Filter theo Product Category
- All Categories
- Từng danh mục cụ thể

### Search
- Tìm kiếm theo title hoặc description

## 💾 Lưu trữ dữ liệu

Ứng dụng sử dụng **localStorage** để lưu trữ dữ liệu (mô phỏng database).

### Cấu trúc dữ liệu tài liệu:
```json
{
  "id": 1,
  "title": "Hóa đơn nhập hàng tháng 1",
  "description": "Nhập hàng đợt 1",
  "documentType": "official",
  "productCategory": {
    "id": 2,
    "name": "Nguyên vật liệu"
  },
  "attachments": ["invoice_1.pdf"],
  "createdAt": "2025-01-10T12:00:00Z",
  "createdBy": "Admin"
}
```

## 🎨 UI/UX

- Sử dụng **TailwindCSS** cho styling
- Responsive design
- Sidebar navigation
- Color-coded badges cho document types
- Hover effects và transitions

## 📝 Danh mục sản phẩm mặc định

1. Máy móc thiết bị
2. Nguyên vật liệu
3. Hàng hóa tiêu dùng
4. Dịch vụ
5. Xăng dầu & Nhiên liệu
6. Văn phòng phẩm
7. Điện tử & Công nghệ
8. Vật liệu xây dựng
9. Nội thất & Trang trí
10. Quần áo & Thời trang

## 🛠️ Technologies

- **React 19.2.0**
- **Vite 7.2.4**
- **React Router DOM** - Routing
- **TailwindCSS** - Styling
- **LocalStorage** - Data persistence

## 📌 Lưu ý

- Dữ liệu được lưu trong localStorage của browser
- Xóa cache browser sẽ xóa toàn bộ dữ liệu
- Để chuyển sang JSON Server, cần cập nhật `src/services/api.js`

## 🎯 Hướng dẫn sử dụng

1. **Tạo tài liệu mới**:
   - Vào "Documents" → Click "New Document"
   - Điền đầy đủ thông tin
   - Chọn danh mục sản phẩm (bắt buộc)
   - Click "Create"

2. **Xem danh sách**:
   - Vào "Documents"
   - Sử dụng filter và search để tìm kiếm

3. **Xem chi tiết**:
   - Click "View" trên bảng danh sách
   - Hoặc click vào title của tài liệu

4. **Sửa/Xóa**:
   - Vào trang chi tiết → Click "Edit" hoặc "Delete"
   - Hoặc dùng các button trên bảng danh sách

## ✅ Checklist hoàn thành

- [x] Cài đặt TailwindCSS
- [x] Tạo Sidebar component
- [x] Tạo DocumentForm component
- [x] Tạo DocumentList component
- [x] Tạo DocumentDetail component
- [x] Tạo Dashboard page
- [x] Tạo ProductCategories page
- [x] Setup routing với React Router
- [x] API service với localStorage
- [x] Filter theo documentType
- [x] Filter theo productCategory
- [x] Search theo title/description
- [x] Lưu productCategory vào document
- [x] UI/UX với TailwindCSS
- [x] Responsive design

## 🚀 Demo hoàn chỉnh!

Ứng dụng đã sẵn sàng để sử dụng. Chạy `npm run dev` và bắt đầu tạo tài liệu!

