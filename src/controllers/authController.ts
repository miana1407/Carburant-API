import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { AuthRequest } from "../middleware/auth";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email et mot de passe requis" });
      return;
    }
    const repo = AppDataSource.getRepository(User);
    if (await repo.findOneBy({ email })) {
      res.status(409).json({ error: "Email déjà utilisé" });
      return;
    }
    const user = repo.create({ email, password });
    await repo.save(user);
    res.status(201).json({ message: "Compte créé", email });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await AppDataSource.getRepository(User).findOneBy({ email });
    if (!user || !(await user.validatePassword(password))) {
      res.status(401).json({ error: "Identifiants incorrects" });
      return;
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" } as jwt.SignOptions
    );
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: req.user!.id },
    select: ["id", "email", "role", "created_at"],
  });
  if (!user) { res.status(404).json({ error: "Non trouvé" }); return; }
  res.json(user);
};