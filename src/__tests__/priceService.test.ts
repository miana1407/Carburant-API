import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AppDataSource avant tout import du service
vi.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: vi.fn(),
  },
}));

import { AppDataSource } from '../config/database';
import { getNationalStats, getDepartementStats } from '../services/priceService';

const mockGetRawMany = vi.fn();
const mockQb = {
  innerJoin: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  addSelect: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  andWhere: vi.fn().mockReturnThis(),
  getRawMany: mockGetRawMany,
};

beforeEach(() => {
  vi.mocked(AppDataSource.getRepository).mockReturnValue({
    createQueryBuilder: vi.fn().mockReturnValue(mockQb),
  } as any);
  vi.clearAllMocks();
  mockQb.innerJoin.mockReturnThis();
  mockQb.select.mockReturnThis();
  mockQb.addSelect.mockReturnThis();
  mockQb.groupBy.mockReturnThis();
  mockQb.where.mockReturnThis();
  mockQb.andWhere.mockReturnThis();
});

describe('getNationalStats', () => {
  it('retourne les stats sans filtre', async () => {
    const mockData = [
      { carburant: 'SP95', moyenne: '1.850', min: '1.750', max: '1.950', ecart_type: '0.050', nb_stations: '120' },
      { carburant: 'Gazole', moyenne: '1.720', min: '1.650', max: '1.800', ecart_type: '0.040', nb_stations: '115' },
    ];
    mockGetRawMany.mockResolvedValue(mockData);

    const result = await getNationalStats();

    expect(result).toEqual(mockData);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('carburant');
    expect(result[0]).toHaveProperty('moyenne');
  });

  it('applique le filtre fuelType', async () => {
    mockGetRawMany.mockResolvedValue([
      { carburant: 'SP95', moyenne: '1.850', min: '1.750', max: '1.950', ecart_type: '0.050', nb_stations: '120' },
    ]);

    const result = await getNationalStats('SP95');

    expect(mockQb.andWhere).toHaveBeenCalledWith('ft.nom = :fuelType', { fuelType: 'SP95' });
    expect(result).toHaveLength(1);
    expect(result[0].carburant).toBe('SP95');
  });

  it('retourne un tableau vide si aucune donnée', async () => {
    mockGetRawMany.mockResolvedValue([]);
    const result = await getNationalStats('XE10');
    expect(result).toEqual([]);
  });
});

describe('getDepartementStats', () => {
  it('retourne les stats pour un département', async () => {
    const mockData = [
      { carburant: 'SP95', moyenne: '1.870', min: '1.800', max: '1.940', ecart_type: '0.030', nb_stations: '12' },
    ];
    mockGetRawMany.mockResolvedValue(mockData);

    const result = await getDepartementStats('56');

    expect(mockQb.where).toHaveBeenCalledWith('s.cp LIKE :dep', { dep: '56%' });
    expect(result).toEqual(mockData);
  });

  it('applique les filtres de date', async () => {
    mockGetRawMany.mockResolvedValue([]);

    await getDepartementStats('56', undefined, '2024-01-01', '2024-12-31');

    expect(mockQb.andWhere).toHaveBeenCalledWith('fp.maj >= :from', expect.any(Object));
    expect(mockQb.andWhere).toHaveBeenCalledWith('fp.maj <= :to', expect.any(Object));
  });
});