export type AssetType = 'ev' | 'arsa' | 'arac';

export type ObligationKind =
  | 'emlak_vergisi'
  | 'dask'
  | 'konut_sigortasi'
  | 'mtv'
  | 'trafik'
  | 'kasko';

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  /** Ev / arsa — satın alma bedeli (numeric). */
  purchasePrice: number | null;
  /** Tahmini güncel değer (numeric). */
  estimatedValue: number;
  /** Araç — marka / model. */
  brandModel: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Dönem: ay+gün (MTV / emlak) veya startDate + yıllık (sigorta).
 * İkisi birden dolu olabilir; nextDue önce startDate yolunu kullanır.
 */
export interface AssetObligation {
  id: string;
  assetId: string;
  kind: ObligationKind;
  amount: number | null;
  /** 1–12 */
  month: number | null;
  /** 1–31 */
  day: number | null;
  /** YYYY-MM-DD — yıllık yenileme başlangıcı */
  startDate: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetsState {
  assets: Asset[];
  obligations: AssetObligation[];
}
