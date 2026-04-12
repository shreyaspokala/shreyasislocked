import type { Game } from '../types';

interface WasmMod {
  default: (input?: unknown) => Promise<unknown>;
  Index: new (data: unknown) => {
    search(q: string, limit: number): unknown;
    all(): unknown;
    len(): number;
  };
}

export interface Searcher {
  search(q: string, limit?: number): Game[];
  all(): Game[];
}

export async function buildSearcher(items: Game[]): Promise<Searcher> {
  try {
    const mod = (await import('./wasm/rust_search.js')) as unknown as WasmMod;
    await mod.default();
    const idx = new mod.Index(items);
    return {
      search: (q, limit = 300) => idx.search(q, limit) as Game[],
      all: () => idx.all() as Game[],
    };
  } catch {
    return jsSearcher(items);
  }
}

function jsSearcher(items: Game[]): Searcher {
  const lower = items.map((i) => i.name.toLowerCase());
  function score(name: string, q: string): number | null {
    if (name.includes(q)) {
      const bonus = name.startsWith(q) ? 100 : 50;
      return bonus + 1000 - name.length;
    }
    let hi = 0, ni = 0, s = 0, streak = 0;
    while (hi < name.length && ni < q.length) {
      if (name[hi] === q[ni]) { streak++; s += 2 + streak * 2; ni++; }
      else streak = 0;
      hi++;
    }
    return ni === q.length ? s : null;
  }
  return {
    all: () => items,
    search: (raw, limit = 300) => {
      const q = raw.trim().toLowerCase();
      if (!q) return items;
      const scored: [number, number][] = [];
      for (let i = 0; i < lower.length; i++) {
        const sc = score(lower[i], q);
        if (sc !== null) scored.push([sc, i]);
      }
      scored.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
      return scored.slice(0, limit).map(([, i]) => items[i]);
    },
  };
}
