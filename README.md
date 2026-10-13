# Hệ thống Quản lý và Báo cáo An toàn Vệ sinh Lao động (Giao diện Frontend)


## Công nghệ sử dụng

| Phân loại | Công nghệ / Thư viện |
|---|---|
| Framework chính | Next.js (App Router) |
| Ngôn ngữ | TypeScript |
| Định dạng giao diện | Tailwind CSS v4 |
| Quản lý trạng thái | Zustand |
| Xử lý & Validate Form | React Hook Form + Zod |
| Thư viện HTTP Client | Axios |

---

## Cấu trúc thư mục dự án

```
app/                  # Định nghĩa các trang (pages) và layouts (Next.js App Router)
libs/
  tts/
    modules/
      accident/       # Xử lý form wizard và xem chi tiết báo cáo tai nạn
      auth/           # Đăng nhập, đăng ký doanh nghiệp, khôi phục tài khoản
      category/       # Quản lý danh mục tai nạn
      company/        # Quản lý hồ sơ thông tin doanh nghiệp
      report-period/  # Quản lý kỳ báo cáo
      user/           # Quản lý người dùng hệ thống
    store/            # Zustand global stores (Quản lý trạng thái đăng nhập, token)
  core/               # Cấu hình Axios Client chung và các hàm tiện ích
  shared/             # Các components và interfaces dùng chung
```

---

## Hướng dẫn cài đặt và chạy ứng dụng

### Yêu cầu hệ thống
- Node.js phiên bản 18 trở lên.
- Backend API Server đã được khởi chạy.

### Các bước cài đặt

1. Tải các thư viện phụ thuộc:
```bash
npm install
```

2. Cấu hình biến môi trường:
Tạo file `.env.local` ở thư mục gốc của dự án và cấu hình đường dẫn API:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

3. Khởi chạy ứng dụng ở chế độ phát triển (Development):
```bash
npm run dev
```

Ứng dụng sẽ chạy tại địa chỉ: [http://localhost:3000](http://localhost:3000).

---

