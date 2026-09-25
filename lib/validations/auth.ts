import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Please enter your email address." })
    .email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(1, { message: "Please enter your password." })
    .min(6, { message: "Password must be at least 6 characters." }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
