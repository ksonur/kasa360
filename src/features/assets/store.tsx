import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { defaultObligationSeeds } from './defaults';
import { loadAssetsState, saveAssetsState } from './persistence';
import type {
  Asset,
  AssetObligation,
  AssetsState,
  AssetType,
  ObligationKind,
} from './types';

interface UpsertAssetInput {
  id?: string;
  type: AssetType;
  name: string;
  purchasePrice: number | null;
  estimatedValue: number;
  brandModel: string | null;
  /** Yeni varlık için opsiyonel yıllık sigorta başlangıçları. */
  daskStartDate?: string | null;
  konutStartDate?: string | null;
  trafikStartDate?: string | null;
  kaskoStartDate?: string | null;
}

interface UpsertObligationInput {
  id?: string;
  assetId: string;
  kind: ObligationKind;
  amount: number | null;
  month: number | null;
  day: number | null;
  startDate: string | null;
}

interface AssetsContextValue {
  assets: Asset[];
  obligations: AssetObligation[];
  hydrating: boolean;
  upsertAsset: (input: UpsertAssetInput) => string;
  softDeleteAsset: (id: string) => void;
  upsertObligation: (input: UpsertObligationInput) => string;
  softDeleteObligation: (id: string) => void;
}

const AssetsContext = createContext<AssetsContextValue | null>(null);

const SAVE_DEBOUNCE_MS = 300;

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeObligation(
  assetId: string,
  kind: ObligationKind,
  partial: {
    month?: number | null;
    day?: number | null;
    startDate?: string | null;
    amount?: number | null;
  }
): AssetObligation {
  const now = new Date().toISOString();
  return {
    id: newId('aob'),
    assetId,
    kind,
    amount: partial.amount ?? null,
    month: partial.month ?? null,
    day: partial.day ?? null,
    startDate: partial.startDate ?? null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function AssetsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AssetsState>({
    assets: [],
    obligations: [],
  });
  const [hydrating, setHydrating] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    let mounted = true;
    loadAssetsState().then((s) => {
      if (!mounted) return;
      setState(s);
      setHydrating(false);
    });
    return () => {
      mounted = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (hydrating) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveAssetsState(state);
    }, SAVE_DEBOUNCE_MS);
  }, [state, hydrating]);

  const upsertAsset = useCallback((input: UpsertAssetInput): string => {
    const name = input.name.trim();
    const estimatedValue = Math.round(input.estimatedValue);
    const purchasePrice =
      input.purchasePrice != null ? Math.round(input.purchasePrice) : null;
    const brandModel =
      input.type === 'arac'
        ? input.brandModel?.trim() || null
        : null;
    const now = new Date().toISOString();
    const resultId = input.id ?? newId('asset');

    setState((prev) => {
      if (input.id) {
        return {
          ...prev,
          assets: prev.assets.map((a) =>
            a.id === input.id && a.deletedAt == null
              ? {
                  ...a,
                  type: input.type,
                  name,
                  purchasePrice,
                  estimatedValue,
                  brandModel,
                  updatedAt: now,
                }
              : a
          ),
        };
      }

      const row: Asset = {
        id: resultId,
        type: input.type,
        name,
        purchasePrice,
        estimatedValue,
        brandModel,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      const seeds = defaultObligationSeeds(input.type);
      const newObs: AssetObligation[] = seeds.map((s) =>
        makeObligation(resultId, s.kind, {
          month: s.month,
          day: s.day,
          startDate: s.startDate,
        })
      );

      const addAnnual = (kind: ObligationKind, start: string | null | undefined) => {
        if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return;
        newObs.push(
          makeObligation(resultId, kind, { startDate: start, month: null, day: null })
        );
      };

      if (input.type === 'ev' || input.type === 'arsa') {
        addAnnual('dask', input.daskStartDate);
        addAnnual('konut_sigortasi', input.konutStartDate);
      }
      if (input.type === 'arac') {
        addAnnual('trafik', input.trafikStartDate);
        addAnnual('kasko', input.kaskoStartDate);
      }

      return {
        assets: [row, ...prev.assets],
        obligations: [...newObs, ...prev.obligations],
      };
    });

    return resultId;
  }, []);

  const softDeleteAsset = useCallback((id: string) => {
    const at = new Date().toISOString();
    setState((prev) => ({
      assets: prev.assets.map((a) =>
        a.id === id ? { ...a, deletedAt: at, updatedAt: at } : a
      ),
      obligations: prev.obligations.map((o) =>
        o.assetId === id ? { ...o, deletedAt: at, updatedAt: at } : o
      ),
    }));
  }, []);

  const upsertObligation = useCallback((input: UpsertObligationInput): string => {
    const amount =
      input.amount != null ? Math.round(input.amount) : null;
    const now = new Date().toISOString();
    const resultId = input.id ?? newId('aob');

    setState((prev) => {
      if (input.id) {
        return {
          ...prev,
          obligations: prev.obligations.map((o) =>
            o.id === input.id && o.deletedAt == null
              ? {
                  ...o,
                  kind: input.kind,
                  amount,
                  month: input.month,
                  day: input.day,
                  startDate: input.startDate,
                  updatedAt: now,
                }
              : o
          ),
        };
      }
      const row: AssetObligation = {
        id: resultId,
        assetId: input.assetId,
        kind: input.kind,
        amount,
        month: input.month,
        day: input.day,
        startDate: input.startDate,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      return { ...prev, obligations: [row, ...prev.obligations] };
    });

    return resultId;
  }, []);

  const softDeleteObligation = useCallback((id: string) => {
    const at = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      obligations: prev.obligations.map((o) =>
        o.id === id ? { ...o, deletedAt: at, updatedAt: at } : o
      ),
    }));
  }, []);

  const value = useMemo<AssetsContextValue>(
    () => ({
      assets: state.assets,
      obligations: state.obligations,
      hydrating,
      upsertAsset,
      softDeleteAsset,
      upsertObligation,
      softDeleteObligation,
    }),
    [
      state,
      hydrating,
      upsertAsset,
      softDeleteAsset,
      upsertObligation,
      softDeleteObligation,
    ]
  );

  return (
    <AssetsContext.Provider value={value}>{children}</AssetsContext.Provider>
  );
}

export function useAssets(): AssetsContextValue {
  const ctx = useContext(AssetsContext);
  if (!ctx) throw new Error('useAssets, AssetsProvider içinde kullanılmalı');
  return ctx;
}
