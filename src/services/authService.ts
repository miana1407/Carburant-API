import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

export const registerUser = async (email: string, password: string) => {
  const repo = AppDataSource.getRepository(User);
  if (await repo.findOneBy({ email })) throw new Error('EMAIL_TAKEN');
  const user = repo.create({ email, password });
  await repo.save(user);
  return { email };
};

export const loginUser = async (email: string, password: string) => {
  const user = await AppDataSource.getRepository(User).findOneBy({ email });
  if (!user || !(await user.validatePassword(password))) throw new Error('INVALID_CREDENTIALS');

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' } as jwt.SignOptions
  );
  return { token, user: { id: user.id, email: user.email, role: user.role } };
};

export const getMe = async (userId: number) => {
  return AppDataSource.getRepository(User).findOne({
    where: { id: userId },
    select: ['id', 'email', 'role', 'created_at'],
  });
};