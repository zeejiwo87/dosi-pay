'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Edit3,
  Package,
  PackageCheck,
  PackageX,
  Plus,
  Search,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useKasir } from '../components/KasirProvider';
import { type Category, type Item, csvDownload, parseNominal, rp, uid } from '../lib/data';

type Editor = {
  id?: string;
  name: string;
  price: string;
  category: Category;
  stock: string;
  unlimited: boolean;
  active: boolean;
};

type Filter = 'Semua' | Category;

const blank = (): Editor => ({
  name: '',
  price: '',
  category: 'Kantin',
  stock: '',
  unlimited: false,
  active: true,
});

const panel = 'rounded-[20px] border border-[#E6ECE7] bg-white';
const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5A52D] focus-visible:ring-offset-2';
const field = `h-11 w-full min-w-0 rounded-[12px] border border-[#DFE8E1] bg-white px-3.5 text-[13px] font-medium text-[#142019] outline-none transition-colors focus:border-[#105D38] focus:ring-2 focus:ring-[#105D38]/10 placeholder:text-[#9BA9A0]`;
const greenButton = `inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-[#105D38] px-4 text-[13px] font-bold text-white transition-colors duration-150 hover:bg-[#0C4A2D] active:bg-[#083B23] disabled:cursor-not-allowed disabled:opacity-45 ${focus}`;

function Metric({
  label,
  value,
  icon: Icon,
  gold = false,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  gold?: boolean;
}) {
  return (
    <div className={`${panel} min-w-0 px-3 py-3.5 sm:p-5`}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-semibold text-[#718077] sm:text-[12px]">{label}</span>
        <span className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-[11px] sm:flex ${gold ? 'bg-[#FBF3DD] text-[#AC8119]' : 'bg-[#ECF7EF] text-[#105D38]'}`}>
          <Icon size={18} strokeWidth={1.9} />
        </span>
      </div>
      <p className={`mt-2 text-[22px] font-extrabold leading-none tracking-[-0.7px] tabular-nums sm:mt-3 sm:text-[28px] ${gold ? 'text-[#A47810]' : 'text-[#142019]'}`}>
        {value}
      </p>
    </div>
  );
}

function StatusSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-[26px] w-[45px] shrink-0 items-center rounded-full p-[3px] transition-colors duration-150 ${checked ? 'bg-[#105D38]' : 'bg-[#DCE5DE]'} ${focus}`}
    >
      <span className={`block h-5 w-5 rounded-full shadow-sm transition-transform duration-150 ${checked ? 'translate-x-[19px] bg-[#E0B341]' : 'translate-x-0 bg-white'}`} />
    </button>
  );
}

/** Dialog memakai portal supaya tidak terpotong animasi atau container KasirShell. */
function Dialog({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  const closeRef = useRef(onClose);
  const dialogRef = useRef<HTMLDivElement>(null);
  closeRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>('[data-dialog-focus]')?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ));
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5">
      <button
        type="button"
        aria-label="Tutup dialog"
        onClick={onClose}
        className="absolute inset-0 bg-[#102418]/45"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white sm:max-h-[min(90dvh,760px)] sm:max-w-[500px] sm:rounded-[22px]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#E6ECE7] px-5 py-4 sm:px-6">
          <h2 className="text-[17px] font-bold tracking-[-0.4px] text-[#142019]">{title}</h2>
          <button
            type="button"
            data-dialog-focus
            aria-label="Tutup"
            onClick={onClose}
            className={`flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F3F7F4] text-[#506155] ${focus}`}
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        <div className="shrink-0 border-t border-[#E6ECE7] bg-white px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5">
          {footer}
        </div>
      </div>
    </div>,
    document.body
  );
}

function ProductIcon() {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#ECF7EF] text-[#105D38]">
      <Package size={19} strokeWidth={1.85} aria-hidden="true" />
    </span>
  );
}

export default function Produk() {
  const { store, ready, saveProduct, deleteProduct } = useKasir();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Filter>('Semua');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const total = store.products.length;
  const activeCount = store.products.filter((p) => p.active).length;
  const lowStock = store.products.filter((p) => p.stock !== null && p.stock <= 5).length;
  const products = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id-ID');
    return store.products.filter(
      (product) =>
        product.name.toLocaleLowerCase('id-ID').includes(query) &&
        (category === 'Semua' || product.category === category)
    );
  }, [store.products, search, category]);

  function openEditor(item?: Item) {
    setError('');
    setEditor(item ? {
      id: item.id,
      name: item.name,
      price: String(item.price),
      category: item.category,
      stock: String(item.stock ?? ''),
      unlimited: item.stock === null,
      active: item.active,
    } : blank());
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    const price = parseNominal(editor.price);
    const stock = parseNominal(editor.stock);
    if (editor.name.trim().length < 2) {
      setError('Nama produk minimal 2 karakter.'); return;
    }
    if (!Number.isSafeInteger(price) || price <= 0 || price > 1_000_000_000) {
      setError('Harga tidak valid.'); return;
    }
    if (!editor.unlimited && (!editor.stock.trim() || !Number.isSafeInteger(stock) || stock < 0 || stock > 1_000_000)) {
      setError('Stok tidak valid.'); return;
    }
    saveProduct({
      id: editor.id || uid('PROD'),
      name: editor.name.trim(),
      price,
      category: editor.category,
      stock: editor.unlimited ? null : stock,
      active: editor.active,
    });
    setEditor(null);
  }

  function exportCsv() {
    csvDownload(
      'dosi-produk.csv',
      ['Nama', 'Kategori', 'Harga', 'Stok', 'Status'],
      products.map((p) => [
        p.name, p.category, p.price, p.stock ?? 'Tanpa batas', p.active ? 'Aktif' : 'Nonaktif',
      ])
    );
  }

  const removing = deleteId ? store.products.find((p) => p.id === deleteId) : null;

  return (
    <div className="min-w-0 text-[#142019]">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
        <div className="min-w-0">
          <h1 className="text-[25px] font-extrabold tracking-[-0.8px] sm:text-[31px]">Produk</h1>
          <p className="mt-1 text-[12px] text-[#718077] sm:text-[13px]">Kelola produk dan stok</p>
        </div>
        <button type="button" onClick={() => openEditor()} className={`${greenButton} shrink-0 px-3.5 sm:px-4`}>
          <Plus size={18} strokeWidth={2.2} />
          <span className="sm:hidden">Tambah</span>
          <span className="hidden sm:inline">Tambah produk</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <Metric label="Total produk" value={ready ? total : '—'} icon={Package} />
        <Metric label="Aktif" value={ready ? activeCount : '—'} icon={PackageCheck} />
        <Metric label="Stok menipis" value={ready ? lowStock : '—'} icon={PackageX} gold />
      </div>

      <section className={`${panel} mt-5 min-w-0 overflow-hidden sm:mt-6`}>
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-[#E6ECE7] p-3.5 sm:flex-row sm:items-center sm:p-5">
          <div className="relative min-w-0 flex-1">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#89988E]" />
            <input
              aria-label="Cari produk"
              placeholder="Cari produk"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`${field} pl-10 pr-9`}
            />
            {search && (
              <button type="button" aria-label="Hapus pencarian" onClick={() => setSearch('')} className={`absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#839187] hover:bg-[#F3F7F4] ${focus}`}>
                <X size={15} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 sm:shrink-0">
            <label className="relative min-w-0 flex-1 sm:w-[150px] sm:flex-none">
              <span className="sr-only">Filter kategori</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as Filter)}
                className={`${field} cursor-pointer appearance-none pr-9`}
              >
                <option value="Semua">Semua kategori</option>
                <option value="Kantin">Kantin</option>
                <option value="Koperasi">Koperasi</option>
                <option value="Lainnya">Lainnya</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#718077]" />
            </label>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!ready || products.length === 0}
              aria-label="Unduh CSV produk"
              title="Unduh CSV"
              className={`inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-[12px] border border-[#DFE8E1] bg-white px-3 text-[12px] font-semibold text-[#105D38] transition-colors hover:bg-[#F3F7F4] disabled:opacity-40 ${focus}`}
            >
              <Download size={17} />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>
          </div>
        </div>

        {!ready ? (
          <p className="px-5 py-14 text-center text-[13px] text-[#718077]">Memuat produk...</p>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#ECF7EF] text-[#105D38]"><Package size={23} /></span>
            <p className="mt-3 text-[14px] font-bold">{total === 0 ? 'Belum ada produk' : 'Produk tidak ditemukan'}</p>
            {total === 0 ? (
              <button type="button" className="mt-3 text-[12px] font-bold text-[#105D38] hover:underline" onClick={() => openEditor()}>Tambah produk</button>
            ) : (
              <button type="button" className="mt-3 text-[12px] font-bold text-[#105D38] hover:underline" onClick={() => { setSearch(''); setCategory('Semua'); }}>Reset filter</button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: daftar tap-to-edit, tidak ada tabel horizontal */}
            <div className="divide-y divide-[#EDF1ED] md:hidden">
              {products.map((product) => (
                <article key={product.id} className="flex items-center gap-3 px-3.5 py-3.5">
                  <button
                    type="button"
                    onClick={() => openEditor(product)}
                    aria-label={`Edit ${product.name}`}
                    className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left ${focus}`}
                  >
                    <ProductIcon />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-[#142019]">{product.name}</span>
                      <span className="mt-1 block truncate text-[12px] font-bold tabular-nums text-[#105D38]">{rp(product.price)}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-[#829187]">
                        {product.category} · {product.stock === null ? 'Stok tanpa batas' : `Stok ${product.stock}`}
                      </span>
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-[#B0BDB3]" />
                  </button>
                  <StatusSwitch
                    checked={product.active}
                    label={`${product.active ? 'Nonaktifkan' : 'Aktifkan'} ${product.name}`}
                    onChange={() => saveProduct({ ...product, active: !product.active })}
                  />
                </article>
              ))}
            </div>

            {/* PC/tablet: tabel standar tanpa scroll horizontal */}
            <div className="hidden md:block">
              <table className="w-full table-fixed border-collapse text-left text-[12px] lg:text-[13px]">
                <thead className="border-b border-[#E6ECE7] bg-[#FBFCFB] text-[11px] font-semibold text-[#718077]">
                  <tr>
                    <th className="w-[31%] px-5 py-3.5 font-semibold">Produk</th>
                    <th className="w-[15%] px-2 py-3.5 font-semibold">Kategori</th>
                    <th className="w-[18%] px-2 py-3.5 font-semibold">Harga</th>
                    <th className="w-[14%] px-2 py-3.5 font-semibold">Stok</th>
                    <th className="w-[12%] px-2 py-3.5 font-semibold">Status</th>
                    <th className="w-[10%] py-3.5 pr-5 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF1ED]">
                  {products.map((product) => (
                    <tr key={product.id} className="transition-colors hover:bg-[#FAFCFA]">
                      <td className="px-5 py-3.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <ProductIcon />
                          <span className="min-w-0 truncate font-semibold" title={product.name}>{product.name}</span>
                        </div>
                      </td>
                      <td className="truncate px-2 py-3.5 text-[#718077]">{product.category}</td>
                      <td className="whitespace-nowrap px-2 py-3.5 font-bold tabular-nums text-[#105D38]">{rp(product.price)}</td>
                      <td className="px-2 py-3.5">
                        {product.stock === null ? (
                          <span className="text-[#718077]">Tanpa batas</span>
                        ) : (
                          <span className={`font-medium tabular-nums ${product.stock <= 5 ? 'text-[#AA7D18]' : 'text-[#526456]'}`}>
                            {product.stock}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3.5">
                        <StatusSwitch
                          checked={product.active}
                          label={`${product.active ? 'Nonaktifkan' : 'Aktifkan'} ${product.name}`}
                          onChange={() => saveProduct({ ...product, active: !product.active })}
                        />
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex justify-end gap-1">
                          <button type="button" title="Edit" aria-label={`Edit ${product.name}`} onClick={() => openEditor(product)} className={`flex h-9 w-9 items-center justify-center rounded-[10px] text-[#105D38] hover:bg-[#ECF7EF] ${focus}`}><Edit3 size={16} /></button>
                          <button type="button" title="Hapus" aria-label={`Hapus ${product.name}`} onClick={() => setDeleteId(product.id)} className={`flex h-9 w-9 items-center justify-center rounded-[10px] text-[#B65B55] hover:bg-[#FFF2F0] ${focus}`}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#EDF1ED] px-4 py-3 text-[11px] text-[#8A998E] sm:px-5">{products.length} produk</div>
          </>
        )}
      </section>

      {editor && (
        <Dialog title={editor.id ? 'Edit produk' : 'Tambah produk'} onClose={() => setEditor(null)} footer={
          <div className="flex items-center gap-2.5">
            {editor.id && (
              <button
                type="button"
                aria-label="Hapus produk ini"
                title="Hapus produk"
                onClick={() => { setDeleteId(editor.id!); setEditor(null); }}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-[#F2D8D5] text-[#B65B55] hover:bg-[#FFF2F0] ${focus}`}
              >
                <Trash2 size={18} />
              </button>
            )}
            <button type="submit" form="dosi-product-form" className={`${greenButton} flex-1`}>
              <Check size={17} /> Simpan produk
            </button>
          </div>
        }>
          <form id="dosi-product-form" onSubmit={save} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-[#46584B]">Nama produk</span>
              <input
                required
                maxLength={60}
                autoComplete="off"
                value={editor.name}
                onChange={(event) => { setEditor({ ...editor, name: event.target.value }); setError(''); }}
                placeholder="Nama produk"
                className={field}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block min-w-0">
                <span className="mb-1.5 block text-[12px] font-semibold text-[#46584B]">Harga</span>
                <span className="relative block">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#105D38]">Rp</span>
                  <input
                    value={editor.price ? Number(editor.price).toLocaleString('id-ID') : ''}
                    onChange={(event) => { setEditor({ ...editor, price: event.target.value.replace(/\D/g, '').slice(0, 10) }); setError(''); }}
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    className={`${field} pl-9`}
                  />
                </span>
              </label>
              <label className="block min-w-0">
                <span className="mb-1.5 block text-[12px] font-semibold text-[#46584B]">Kategori</span>
                <span className="relative block">
                  <select
                    value={editor.category}
                    onChange={(event) => setEditor({ ...editor, category: event.target.value as Category })}
                    className={`${field} appearance-none pr-8`}
                  >
                    <option value="Kantin">Kantin</option>
                    <option value="Koperasi">Koperasi</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#718077]" />
                </span>
              </label>
            </div>
            <div className="rounded-[14px] border border-[#E6ECE7] p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-[#24382B]">Stok tanpa batas</p>
                </div>
                <StatusSwitch
                  checked={editor.unlimited}
                  label="Stok tanpa batas"
                  onChange={() => setEditor({ ...editor, unlimited: !editor.unlimited })}
                />
              </div>
              {!editor.unlimited && (
                <label className="mt-3 block border-t border-[#EDF1ED] pt-3">
                  <span className="mb-1.5 block text-[12px] font-semibold text-[#46584B]">Jumlah stok</span>
                  <input
                    value={editor.stock}
                    onChange={(event) => { setEditor({ ...editor, stock: event.target.value.replace(/\D/g, '').slice(0, 7) }); setError(''); }}
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    className={field}
                  />
                </label>
              )}
            </div>
            <div className="flex items-center justify-between rounded-[14px] border border-[#E6ECE7] px-3.5 py-3.5">
              <span className="text-[12px] font-semibold text-[#24382B]">Produk aktif</span>
              <StatusSwitch checked={editor.active} label="Produk aktif" onChange={() => setEditor({ ...editor, active: !editor.active })} />
            </div>
            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-[12px] border border-[#F1D8D4] bg-[#FFF5F2] px-3 py-2.5 text-[12px] font-medium text-[#A6423C]">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
              </div>
            )}
          </form>
        </Dialog>
      )}

      {deleteId && (
        <Dialog title="Hapus produk?" onClose={() => setDeleteId(null)} footer={
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setDeleteId(null)} className={`h-11 rounded-[12px] border border-[#DFE8E1] text-[13px] font-semibold text-[#516155] hover:bg-[#F3F7F4] ${focus}`}>Batal</button>
            <button type="button" onClick={() => { deleteProduct(deleteId); setDeleteId(null); }} className={`h-11 rounded-[12px] bg-[#B34D49] text-[13px] font-bold text-white hover:bg-[#983D38] ${focus}`}>Hapus</button>
          </div>
        }>
          <p className="text-[13px] leading-relaxed text-[#596B60]">
            <span className="font-bold text-[#142019]">{removing?.name ?? 'Produk'}</span> akan dihapus dari katalog.
          </p>
        </Dialog>
      )}
    </div>
  );
}
