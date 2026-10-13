import { z } from 'zod';

export const companySchema = z.object({
  business_name: z
    .string()
    .min(1, 'Tên doanh nghiệp không được để trống')
    .refine(
      (val) => /^[\p{L}\p{M}\p{N}\s]+$/u.test(val),
      { message: 'Không được chứa ký tự đặc biệt' }
    ),
  tax_code: z
    .string()
    .min(1, 'Mã số thuế không được để trống')
    .regex(
      /^(\d{10}|\d{10}-\d{3})$/,
      'Mã số thuế không hợp lệ, phải đủ 10 chữ số hoặc 13 chữ số. Vd: 1234567890 hoặc 1234567890-123'
    ),
  business_type: z.string().min(1, 'Bắt buộc phải chọn loại hình kinh doanh'),
  business_industry: z.string().min(1, 'Bắt buộc phải chọn ngành nghề kinh doanh chính'),
  license_issue_date: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return (
          /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(val) ||
          /^\d{4}-\d{2}-\d{2}$/.test(val)
        );
      },
      { message: 'Ngày cấp phải ở định dạng dd/mm/yyyy hoặc dd-mm-yyyy' }
    )
    .refine(
      (val) => {
        if (!val) return true;
        let parsedDate: Date;
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          const [year, month, day] = val.split('-').map(Number);
          parsedDate = new Date(year, month - 1, day);
        } else {
          const sep = val.includes('/') ? '/' : '-';
          const [day, month, year] = val.split(sep).map(Number);
          parsedDate = new Date(year, month - 1, day);
        }
        if (isNaN(parsedDate.getTime())) return false;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        parsedDate.setHours(0, 0, 0, 0);
        return parsedDate <= today;
      },
      { message: 'Ngày cấp GPKD không được lớn hơn ngày hiện tại' }
    )
    .or(z.literal('')),
  license_registration_province: z.string().min(1, 'Bắt buộc phải cung cấp tỉnh/thành phố ĐKKD'),
  license_registration_ward: z.string().min(1, 'Bắt buộc phải cung cấp phường/xã ĐKKD'),
  license_registration_adress: z.string().optional().or(z.literal('')),
  foreign_business_name: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return /^[\p{L}\p{M}\p{N}\s]+$/u.test(val);
      },
      { message: 'Không được chứa ký tự đặc biệt' }
    )
    .or(z.literal('')),
  email: z
    .string()
    .min(1, 'Bắt buộc phải cung cấp email')
    .email('Email không đúng định dạng'),
  business_phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return /^(0[3|5|7|8|9])+([0-9]{8})$/.test(val) || /^(02)+([0-9]{8,9})$/.test(val);
      },
      { message: 'Số điện thoại doanh nghiệp không hợp lệ (hỗ trợ di động 10 số hoặc máy bàn bắt đầu bằng 02)' }
    )
    .or(z.literal('')),
  business_operating_province: z.string().optional().or(z.literal('')),
  business_operating_ward: z.string().optional().or(z.literal('')),
  business_operating_adress: z.string().optional().or(z.literal('')),
  representative_name: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return /^[\p{L}\p{M}\s]+$/u.test(val);
      },
      { message: 'Họ và tên người đại diện không được chứa số hoặc ký tự đặc biệt' }
    )
    .or(z.literal('')),
  representative_phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return /^(0[3|5|7|8|9])+([0-9]{8})$/.test(val);
      },
      { message: 'Số điện thoại người đại diện không hợp lệ (di động 10 số, bắt đầu bằng 03/05/07/08/09)' }
    )
    .or(z.literal('')),
  business_license_file_url: z.string().min(1, 'Vui lòng tải lên giấy phép đăng ký kinh doanh'),
  other_document_file_url: z.string().nullable().optional(),
});

export type CompanyInput = z.infer<typeof companySchema>;
