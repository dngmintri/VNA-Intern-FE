import { z } from 'zod';

export const profileSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập là bắt buộc'),
  fullName: z.string().min(1, 'Họ và tên là bắt buộc'),
  dateOfBirth: z
  .string()
  .optional()
  .refine((dateStr) => {
    if (!dateStr) return true;
    
    const parts = dateStr.split('-');
    if (parts.length !== 3) return false;
    const [year, month, day] = parts.map(Number);
    const inputDate = new Date(year, month - 1, day);
    if (isNaN(inputDate.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    return inputDate <= today;
  }, {
    message: "Ngày sinh không được vượt quá ngày hiện tại!",
  }),
  gender: z.string().optional(),
  position: z.string().optional(),
  roleId: z.union([z.number(), z.string(), z.null()]).optional(),
  email: z.string().email('Email không đúng định dạng').min(1, 'Email là bắt buộc'),
  provinceId: z.string().optional(),
  wardId: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean(),
  avatarUrl: z.string().optional().nullable(),
});

export type ProfileInput = z.infer<typeof profileSchema>;