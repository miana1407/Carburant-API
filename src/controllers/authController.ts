import { Request, Response } from 'express';
import { registerUser, loginUser, getMe } from '../services/authService';
import { AuthRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ error: 'Email et mot de passe requis' }); return; }
    const result = await registerUser(email, password);
    res.status(201).json({ message: 'Compte créé', ...result });
  } catch (err: any) {
    if (err.message === 'EMAIL_TAKEN') { res.status(409).json({ error: 'Email déjà utilisé' }); return; }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.json(result);
  } catch (err: any) {
    if (err.message === 'INVALID_CREDENTIALS') { res.status(401).json({ error: 'Identifiants incorrects' }); return; }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await getMe(req.user!.id);
  if (!user) { res.status(404).json({ error: 'Non trouvé' }); return; }
  res.json(user);
};