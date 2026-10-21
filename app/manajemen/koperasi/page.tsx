'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  Check, ChevronDown, Download, Package, Pencil, Plus,
  Search, ShoppingBag, Warehouse, X, type LucideIcon,
} from 'lucide-react';
import { useManajemen } from '../components/ManajemenProvider';
import { exportCSV, rp, uid, type Product, type Category } from '../lib/data';

const panel = 'rounded-[20px] border border-[#E6ECE7] bg-white';
const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]';
const field = `h-11 w-full rounded-[12px] border border-[#DFE8E1] bg-white px-3.5 text-[13px] text-[#142019] outline-none placeholder:text-[#A0AEA3] focus:border-[#105D38] ${focus}`;
const blank = (): Product => ({ id: '', name: '', category: 'Kantin', price: 0, stock: 0, active: true });
const CATEGORIES: Category[] = ['Kantin', 'Koperasi', 'Lainnya'];
type Filter = 'Semua' | Category;

function Metric({ label, count, icon: Icon, gold = false }: { label: string; count: number; icon: LucideIcon; gold?: boolean }) {
  return <article className={`${panel} min-w-0 p-3.5 sm:p-5`}>
    <span className={`flex h-9 w-9 items-center justify-center rounded-[11px] ${gold ? 'bg-[#FAF1D8] text-[#967014]' : 'bg-[#ECF7EF] text-[#105D38]'}`}><Icon size={18} strokeWidth={1.8}/></span>
    <p className="mt-3 text-[11px] leading-snug text-[#718077] sm:text-[12px]">{label}</p>
    <p className="mt-1 text-[23px] font-extrabold tabular-nums text-[#142019] sm:text-[26px]">{count}</p>
  </article>;
}

function Badge({ active }: { active: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${active ? 'bg-[#ECF7EF] text-[#105D38]' : 'bg-[#F1F3F1] text-[#79877D]'}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-[#32965B]' : 'bg-[#ABB8AE]'}`}/>{active ? 'Aktif' : 'Nonaktif'}</span>;
}

function ProductSheet({
  product, unlimited, error, isEdit, onChange, onUnlimited, onClose, onSubmit,
}: {
  product: Product;
  unlimited: boolean;
  error: string;
  isEdit: boolean;
  onChange: (product: Product) => void;
  onUnlimited: (unlimited: boolean) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', esc); previousFocus?.focus(); };
  }, [onClose]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5">
      <button type="button" aria-label="Tutup form" onClick={onClose} className="absolute inset-0 bg-[#102719]/50"/>
      <section role="dialog" aria-modal="true" aria-labelledby="product-sheet-title" className="dosi-product-sheet relative flex max-h-[93dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white sm:max-w-[500px] sm:rounded-[22px]">
        <header className="flex shrink-0 items-center justify-between border-b border-[#E6ECE7] px-5 py-4 sm:px-6">
          <h2 id="product-sheet-title" className="text-[17px] font-bold tracking-[-.4px] text-[#142019]">{isEdit ? 'Kelola Produk' : 'Tambah Produk'}</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Tutup" className={`${focus} flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F3F7F4] text-[#506157]`}><X size={19}/></button>
        </header>
        <form id="product-form" onSubmit={onSubmit} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          <label className="block text-[12px] font-semibold text-[#506157]">Nama produk
            <input required maxLength={70} value={product.name} onChange={e => onChange({ ...product, name: e.target.value })} className={`${field} mt-2`} placeholder="Contoh: Roti coklat"/>
          </label>
          <div className="grid grid-cols-1 gap-4 min-[390px]:grid-cols-2">
            <label className="block text-[12px] font-semibold text-[#506157]">Kategori
              <div className="relative mt-2"><select value={product.category} onChange={e => onChange({ ...product, category: e.target.value as Category })} className={`${field} appearance-none pr-8`}>{CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-3.5 text-[#7B8C80]"/></div>
            </label>
            <label className="block text-[12px] font-semibold text-[#506157]">Harga (Rp)
              <input required type="text" inputMode="numeric" value={product.price ? product.price.toLocaleString('id-ID') : ''} onChange={e => onChange({ ...product, price: Number(e.target.value.replace(/\D/g, '').slice(0, 10)) })} className={`${field} mt-2`} placeholder="0"/>
            </label>
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border border-[#E6ECE7] px-4 py-3.5"><span className="text-[13px] font-semibold text-[#24382B]">Stok tanpa batas</span><input type="checkbox" checked={unlimited} onChange={e => onUnlimited(e.target.checked)} className="h-[18px] w-[18px] accent-[#105D38]"/></label>
          {!unlimited && <label className="block text-[12px] font-semibold text-[#506157]">Jumlah stok
            <input required type="text" inputMode="numeric" value={product.stock ?? 0} onChange={e => onChange({ ...product, stock: Number(e.target.value.replace(/\D/g, '').slice(0, 9)) })} className={`${field} mt-2`} placeholder="0"/>
          </label>}
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border border-[#E6ECE7] px-4 py-3.5"><span className="text-[13px] font-semibold text-[#24382B]">Produk aktif</span><input type="checkbox" checked={product.active} onChange={e => onChange({ ...product, active: e.target.checked })} className="h-[18px] w-[18px] accent-[#105D38]"/></label>
          {error && <p role="alert" className="rounded-[12px] border border-[#F0DAD6] bg-[#FFF7F5] px-3.5 py-3 text-[12px] font-medium text-[#B44747]">{error}</p>}
        </form>
        <footer className="shrink-0 border-t border-[#E6ECE7] px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5"><button type="submit" form="product-form" className={`${focus} flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#105D38] text-[13px] font-semibold text-white hover:bg-[#0B482B]`}><Check size={17}/>Simpan Produk</button></footer>
      </section>
      <style jsx global>{`@keyframes dosiProductSheetIn { from {opacity:.6; transform:translateY(14px)} to {opacity:1; transform:translateY(0)} } .dosi-product-sheet {animation:dosiProductSheetIn 180ms ease-out both} @media (prefers-reduced-motion:reduce) {.dosi-product-sheet {animation:none}}`}</style>
    </div>, document.body
  );
}

export default function Koperasi() {
  const { kasir, saveProduct } = useManajemen();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('Semua');
  const [edit, setEdit] = useState<Product | null>(null);
  const [unlimited, setUnlimited] = useState(false);
  const [error, setError] = useState('');
  const closeEditor = useCallback(() => setEdit(null), []);

  const products = useMemo(() => kasir.products.filter(product =>
    (filter === 'Semua' || product.category === filter) && product.name.toLowerCase().includes(search.trim().toLowerCase())
  ), [kasir.products, filter, search]);

  function openEditor(product?: Product) {
    const item = product ? { ...product } : blank();
    setEdit(item);
    setUnlimited(item.stock === null);
    setError('');
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!edit) return;
    const product: Product = {
      ...edit,
      id: edit.id || uid('PRD'),
      name: edit.name.trim(),
      stock: unlimited ? null : edit.stock,
    };
    if (!product.name || !Number.isSafeInteger(product.price) || product.price <= 0 ||
      (product.stock !== null && (!Number.isSafeInteger(product.stock) || product.stock < 0))) {
      setError('Periksa nama, harga, dan stok.'); return;
    }
    if (saveProduct(product)) { setEdit(null); setError(''); }
    else setError('Produk tidak dapat disimpan.');
  }

  function download() {
    exportCSV('dosi-produk.csv', ['ID', 'Produk', 'Kategori', 'Harga', 'Stok', 'Status'],
      kasir.products.map(product => [product.id, product.name, product.category, product.price, product.stock ?? 'Tanpa batas', product.active ? 'Aktif' : 'Nonaktif']));
  }

  return <div className="w-full min-w-0 text-[#142019]">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-[24px] font-extrabold tracking-[-.8px] sm:text-[30px]">Koperasi & Produk</h1><p className="mt-1 text-[12px] text-[#718077] sm:text-[13px]">Katalog dan persediaan</p></div>
      <div className="flex items-center gap-2"><button type="button" onClick={download} disabled={!kasir.products.length} className={`${focus} inline-flex h-11 items-center gap-2 rounded-[12px] border border-[#E6ECE7] px-3 text-[12px] font-semibold text-[#105D38] hover:bg-[#F7FAF8] disabled:opacity-40`}><Download size={17}/>CSV</button><button type="button" onClick={() => openEditor()} className={`${focus} inline-flex h-11 items-center gap-2 rounded-[12px] bg-[#105D38] px-3.5 text-[12px] font-semibold text-white hover:bg-[#0B482B] sm:px-4`}><Plus size={17}/>Tambah Produk</button></div>
    </header>

    <div className="mb-5 grid grid-cols-3 gap-3">
      <Metric label="Produk aktif" count={kasir.products.filter(p => p.active).length} icon={ShoppingBag}/>
      <Metric label="Stok menipis" count={kasir.products.filter(p => p.stock !== null && p.stock <= 5).length} icon={Warehouse} gold/>
      <Metric label="Total produk" count={kasir.products.length} icon={Package}/>
    </div>

    <section className={`${panel} min-w-0 overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-[#E6ECE7] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="shrink-0"><h2 className="text-[16px] font-bold">Daftar Produk</h2><p className="mt-1 text-[11px] text-[#718077]">{products.length} produk</p></div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-1 sm:flex-row sm:justify-end"><div className="relative min-w-0 sm:max-w-[310px] sm:flex-1"><Search size={17} className="pointer-events-none absolute left-3.5 top-3.5 text-[#8D9C91]"/><input type="search" aria-label="Cari produk" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk" className={`${field} pl-10`}/></div>
          <div className="relative sm:w-[160px]"><select aria-label="Filter kategori" value={filter} onChange={e => setFilter(e.target.value as Filter)} className={`${field} appearance-none pr-8`}><option value="Semua">Semua kategori</option>{CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-3.5 text-[#819087]"/></div>
        </div>
      </div>

      {products.length ? <>
        <div className="divide-y divide-[#EDF1ED] lg:hidden">{products.map(product => <button type="button" key={product.id} onClick={() => openEditor(product)} className={`${focus} flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-[#F7FAF8] active:bg-[#ECF7EF]`}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#ECF7EF] text-[#105D38]"><Package size={20} strokeWidth={1.8}/></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-bold text-[#142019]">{product.name}</span><span className="mt-1 block text-[11px] text-[#718077]">{product.category} · Stok {product.stock === null ? '∞' : product.stock}</span><span className="mt-1 block"><Badge active={product.active}/></span></span>
          <span className="shrink-0 text-right"><span className="block whitespace-nowrap text-[13px] font-bold tabular-nums text-[#105D38]">{rp(product.price)}</span><span className="mt-2 inline-flex items-center justify-end gap-1 text-[10px] text-[#819087]"><Pencil size={11}/>Ubah</span></span>
        </button>)}</div>
        <div className="hidden lg:block"><table className="w-full table-fixed border-collapse text-left"><thead><tr className="border-b border-[#E6ECE7] bg-[#FAFCFA] text-[11px] text-[#718077]"><th className="w-[32%] px-5 py-3.5 font-semibold">Produk</th><th className="w-[15%] px-3 py-3.5 font-semibold">Kategori</th><th className="w-[18%] px-3 py-3.5 font-semibold">Harga</th><th className="w-[15%] px-3 py-3.5 font-semibold">Stok</th><th className="w-[12%] px-3 py-3.5 font-semibold">Status</th><th className="w-[8%] px-5 py-3.5 text-right font-semibold">Aksi</th></tr></thead><tbody className="divide-y divide-[#EDF1ED]">{products.map(product => <tr key={product.id} className="hover:bg-[#F8FBF8]"><td className="truncate px-5 py-4 text-[13px] font-semibold text-[#142019]">{product.name}</td><td className="px-3 py-4 text-[12px] text-[#718077]">{product.category}</td><td className="whitespace-nowrap px-3 py-4 text-[13px] font-bold tabular-nums text-[#105D38]">{rp(product.price)}</td><td className="px-3 py-4 text-[12px] text-[#647568]">{product.stock === null ? 'Tanpa batas' : product.stock}</td><td className="px-3 py-4"><Badge active={product.active}/></td><td className="px-5 py-4 text-right"><button type="button" onClick={() => openEditor(product)} className={`${focus} rounded-[9px] border border-[#DDE9E0] px-3 py-2 text-[11px] font-semibold text-[#105D38] hover:bg-[#ECF7EF]`}>Kelola</button></td></tr>)}</tbody></table></div>
      </> : <div className="flex flex-col items-center px-5 py-14 text-center"><Package size={28} className="text-[#105D38]"/><p className="mt-3 text-[13px] font-semibold">Produk tidak ditemukan</p>{(search || filter !== 'Semua') && <button type="button" onClick={() => { setSearch(''); setFilter('Semua'); }} className={`${focus} mt-3 text-[12px] font-semibold text-[#105D38]`}>Reset filter</button>}</div>}
    </section>
    {edit && <ProductSheet product={edit} unlimited={unlimited} error={error} isEdit={Boolean(edit.id)} onChange={next => {setEdit(next); setError('');}} onUnlimited={setUnlimited} onClose={closeEditor} onSubmit={save}/>}
  </div>;
}
