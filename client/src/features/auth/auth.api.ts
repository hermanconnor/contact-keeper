import { api } from '@/lib/api';
import {
  authResponseSchema,
  currentUserResponseSchema,
  type LoginInput,
  type RegisterInput,
  type User,
} from './auth.schemas';

export async function registerRequest(input: RegisterInput) {
  const { data } = await api.post('/auth/register', input);

  return authResponseSchema.parse(data);
}

export async function loginRequest(input: LoginInput) {
  const { data } = await api.post('/auth/login', input);

  return authResponseSchema.parse(data);
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout');
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get('/users/me');

  return currentUserResponseSchema.parse(data).user;
}
