import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, { message: 'Vui lòng nhập đầy đủ thông tin' }),
  password: z.string().min(1, { message: 'Vui lòng nhập đầy đủ thông tin' }),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;