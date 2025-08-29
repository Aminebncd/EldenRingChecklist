import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { api } from '../api/client';

type InputItem = {
  title: string;
  slug?: string;
  expansion?: 'base' | 'sote';
  category?: string;
  subcategory?: string;
  region?: string;
  location?: string;
  tags?: string[];
  prerequisites?: string[];
  weight?: number;
  isUnique?: boolean;
  notes?: string;
};

export default function ImportDialog() {
  const [rows, setRows] = useState<InputItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = useMemo(() => {
    const base = ['title', 'slug', 'expansion', 'category', 'subcategory', 'region', 'location', 'weight', 'tags', 'prerequisites', 'notes'];
    return base;
  }, []);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setMessage(null);
    const f = e.target.files?.[0];
    if (!f) return;

    const ext = f.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = reader.result as string;
        let wb: XLSX.WorkBook;
        if (ext === 'xlsx' || ext === 'xls') {
          wb = XLSX.read(data, { type: 'binary' });
        } else {
          wb = XLSX.read(typeof data === 'string' ? data : '', { type: 'string' });
        }
        const all: InputItem[] = [];
        const isXlsx = ext === 'xlsx' || ext === 'xls';
        for (const name of wb.SheetNames) {
          const ws = wb.Sheets[name];
          const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
          const rows = mapRows(json);
          const sheetExp = isXlsx ? inferExpansion(name) : undefined;
          for (const r of rows) {
            all.push({ ...r, expansion: r.expansion || sheetExp });
          }
        }
        setRows(all);
      } catch (err) {
        console.error(err);
        setError('échec de lecture du fichier');
      }
    };

    if (ext === 'xlsx' || ext === 'xls') {
      // per instruction: use binary string
      reader.readAsBinaryString(f);
    } else {
      reader.readAsText(f);
    }
  }

  async function onImport() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload = rows.map((r) => normalizeItem(r));
      const { data } = await api.post('/items/bulk-upsert', payload);
      setMessage(`import ok — ${data.count} créés`);
      setRows([]);
    } catch (e: any) {
      const msg = e?.response?.data?.error ? JSON.stringify(e.response.data.error) : 'erreur import';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="font-semibold mb-2">import csv/xlsx</div>
      {!token && (
        <div className="mb-2 text-amber-400 text-sm">attention: token manquant — login requis pour importer</div>
      )}
      <div className="text-xs text-zinc-400 mb-2">multi-feuilles: sheet "base" vs "shadow" → détecté automatiquement</div>
      <input
        type="file"
        accept=".csv,.tsv,.xlsx,.xls"
        onChange={onFile}
        className="block text-sm file:btn file:mr-2"
      />
      {/* csv/tsv: l'extension est lue depuis les colonnes (_sheet/expansion) */}

      {error && <div className="mt-2 text-red-400 text-sm">{error}</div>}
      {message && <div className="mt-2 text-emerald-400 text-sm">{message}</div>}

      {rows.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-sm text-zinc-400">aperçu ({Math.min(rows.length, 50)} / {rows.length})</div>
            <button className="btn" disabled={loading} onClick={onImport}>
              {loading ? 'import…' : 'importer'}
            </button>
          </div>
          <div className="overflow-x-auto border border-zinc-800 rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-900/50">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="px-2 py-1 text-left font-medium text-zinc-300">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-zinc-800">
                    <td className="px-2 py-1">{r.title}</td>
                    <td className="px-2 py-1">{r.slug || ''}</td>
                    <td className="px-2 py-1">{r.expansion || 'base'}</td>
                    <td className="px-2 py-1">{r.category || ''}</td>
                    <td className="px-2 py-1">{r.subcategory || ''}</td>
                    <td className="px-2 py-1">{r.region || ''}</td>
                    <td className="px-2 py-1">{r.location || ''}</td>
                    <td className="px-2 py-1">{r.weight ?? ''}</td>
                    <td className="px-2 py-1">{(r.tags || []).join(', ')}</td>
                    <td className="px-2 py-1">{(r.prerequisites || []).join(', ')}</td>
                    <td className="px-2 py-1">{r.notes || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function mapRows(rows: Array<Record<string, unknown>>): InputItem[] {
  return rows
    .map((row) => normalizeKeys(row))
    .filter((r) => typeof r.title === 'string' && r.title.trim().length > 0)
    .map((r) => normalizeItem(r as any));
}

function normalizeItem(r: InputItem): InputItem {
  return {
    title: r.title,
    slug: emptyToUndef(r.slug),
    expansion: (r.expansion as any) || undefined,
    category: emptyToUndef(r.category),
    subcategory: emptyToUndef(r.subcategory),
    region: emptyToUndef(r.region),
    location: emptyToUndef(r.location),
    tags: arrify(r.tags),
    prerequisites: arrify(r.prerequisites),
    weight: numOr(r.weight, 1),
    isUnique: r.isUnique,
    notes: emptyToUndef(r.notes),
  };
}

function normalizeKeys(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  Object.entries(row).forEach(([k, v]) => {
    const key = k.trim().toLowerCase();
    switch (key) {
      case 'title':
      case 'slug':
      case 'expansion':
      case 'category':
      case 'subcategory':
      case 'region':
      case 'location':
      case 'tags':
      case 'prerequisites':
      case 'weight':
      case 'notes':
      case 'isunique':
        out[key === 'isunique' ? 'isUnique' : key] = v;
        break;
      case '_sheet': {
        const s = String(v || '').toLowerCase();
        const exp = s.includes('shadow') || s.includes('sote') || s.includes('dlc') ? 'sote' : s.includes('base') ? 'base' : undefined;
        if (exp) out['expansion'] = exp;
        break;
      }
      default:
        break;
    }
  });
  return out;
}

function arrify(v: unknown): string[] | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  const s = String(v).trim();
  if (!s) return undefined;
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

function numOr(v: unknown, def: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : def;
}

function emptyToUndef(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s0 = String(v).trim();
  const s = trimQuotes(s0).trim();
  return s ? s : undefined;
}

function inferExpansion(sheetName: string): 'base' | 'sote' {
  const n = sheetName.toLowerCase();
  if (n.includes('shadow') || n.includes('sote') || n.includes('dlc')) return 'sote';
  return 'base';
}

function trimQuotes(s: string): string {
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    return s.slice(1, -1);
  }
  return s;
}
