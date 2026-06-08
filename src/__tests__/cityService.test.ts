import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: vi.fn(),
  },
}));

vi.mock('typeorm', async () => {
  const actual = await vi.importActual<typeof import('typeorm')>('typeorm');
  return { ...actual, ILike: vi.fn((val) => ({ $ilike: val })) };
});

import { AppDataSource } from '../config/database';
import { searchCities, getCityByInsee } from '../services/cityService';

const mockFind     = vi.fn();
const mockFindOne  = vi.fn();

beforeEach(() => {
  vi.mocked(AppDataSource.getRepository).mockReturnValue({
    find:    mockFind,
    findOne: mockFindOne,
  } as any);
  vi.clearAllMocks();
});

describe('searchCities', () => {
  it('retourne une liste de villes', async () => {
    const mockCities = [
      { id: 1, nom_standard: 'Lorient', dep_code: '56', code_postal: '56100' },
      { id: 2, nom_standard: 'Larmor-Plage', dep_code: '56', code_postal: '56260' },
    ];
    mockFind.mockResolvedValue(mockCities);

    const result = await searchCities(undefined, '56', undefined, 20);

    expect(result).toHaveLength(2);
    expect(result[0].nom_standard).toBe('Lorient');
  });

  it('limite à 100 résultats maximum', async () => {
    mockFind.mockResolvedValue([]);

    await searchCities(undefined, undefined, undefined, 999);

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });

  it('retourne un tableau vide si aucune ville trouvée', async () => {
    mockFind.mockResolvedValue([]);
    const result = await searchCities('VilleInexistante');
    expect(result).toEqual([]);
  });
});

describe('getCityByInsee', () => {
  it('retourne la ville correspondant au code INSEE', async () => {
    const mockCity = { id: 1, code_insee: '56121', nom_standard: 'Lorient' };
    mockFindOne.mockResolvedValue(mockCity);

    const result = await getCityByInsee('56121');

    expect(result).toEqual(mockCity);
    expect(mockFindOne).toHaveBeenCalledWith({ where: { code_insee: '56121' } });
  });

  it('retourne null si la ville n\'existe pas', async () => {
    mockFindOne.mockResolvedValue(null);
    const result = await getCityByInsee('99999');
    expect(result).toBeNull();
  });
});