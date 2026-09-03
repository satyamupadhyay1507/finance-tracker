import { z } from 'zod';

export const SignupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(150, 'Title is too long'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
});

export const UpdateTaskStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
});
