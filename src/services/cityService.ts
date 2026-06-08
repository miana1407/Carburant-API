import { AppDataSource } from '../config/database';
import { City } from '../entities/City';
import { ILike } from 'typeorm';

export const searchCities = async (
  name?: string,
  dep?: string,
  reg?: string,
  limit: number = 20
) => {
  const where: any = {};
  if (name) where.nom_sans_accent = ILike(`%${name}%`);
  if (dep)  where.dep_code = dep;
  if (reg)  where.reg_code = reg;

  return await AppDataSource.getRepository(City).find({
    where,
    take: Math.min(limit, 100),
    select: ['id', 'code_insee', 'nom_standard', 'dep_code', 'dep_nom',
             'reg_nom', 'code_postal', 'latitude', 'longitude', 'population'],
  });
};

export const getCityByInsee = async (codeInsee: string) => {
  return await AppDataSource.getRepository(City).findOne({
    where: { code_insee: codeInsee },
  });
};