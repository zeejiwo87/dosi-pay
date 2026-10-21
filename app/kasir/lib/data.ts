// DOSI Pay / Kasir — data & finance rules (demo browser-local)
export const COLORS = { primary: '#105D38', mint: '#4CD080' } as const;
export const KEY = {
  store: 'dosi_kasir_store_v1',
  deposits: 'dosi_demo_deposit_history',
  receipt: 'dosi_demo_deposit_receipt',
  limit: 'dosi_wali_daily_snack_limit_v1',
  messages: 'dosi_wali_santri_messages_demo_v1',
  lastSale: 'dosi_kasir_last_sale_v1',
} as const;
export type Category = 'Kantin' | 'Koperasi' | 'Lainnya';
export type Item = { id: string; name: string; price: number; category: Category; active: boolean; stock: number | null };
export type Student = { id: string; name: string; className: string; openingBalance: number; dailyLimit: number; initial: string };
export type SaleLine = { name: string; category: Category; qty: number; price: number; itemId?: string };
export type Sale = { id: string; time: string; studentId: string; studentName: string; cashier: string; lines: SaleLine[]; total: number; biometric: 'demo-verified'; status: 'paid' };
export type Withdrawal = { id: string; time: string; amount: number; note: string; cashier: string; status: 'recorded-demo' };
export type Store = { products: Item[]; students: Student[]; sales: Sale[]; withdrawals: Withdrawal[]; cashier: string };

export const initialStudents: Student[] = [
 { id: '20260001', name: 'Ahmad Fauzan', className: 'VIII A', initial: 'AF', openingBalance: 275000, dailyLimit: 25000 },
 { id: '20260002', name: 'Rizky Maulana', className: 'VIII B', initial: 'RM', openingBalance: 185000, dailyLimit: 35000 },
 { id: '20260003', name: 'Nabila Zahra', className: 'VII A', initial: 'NZ', openingBalance: 310000, dailyLimit: 40000 },
 { id: '20260004', name: 'Fadhil Ramadhan', className: 'IX A', initial: 'FR', openingBalance: 95000, dailyLimit: 30000 },
 { id: '20260005', name: 'Alya Putri', className: 'VII B', initial: 'AP', openingBalance: 145000, dailyLimit: 30000 },
 { id: '20260006', name: 'Ilham Saputra', className: 'IX B', initial: 'IS', openingBalance: 120000, dailyLimit: 25000 },
];
export const initialProducts: Item[] = [
 { id: 'p1', name: 'Nasi Ayam', price: 12000, category: 'Kantin', active: true, stock: 30 },
 { id: 'p2', name: 'Mie Goreng', price: 10000, category: 'Kantin', active: true, stock: 35 },
 { id: 'p3', name: 'Roti Coklat', price: 5000, category: 'Kantin', active: true, stock: 50 },
 { id: 'p4', name: 'Air Mineral', price: 3000, category: 'Kantin', active: true, stock: 80 },
 { id: 'p5', name: 'Es Teh', price: 4000, category: 'Kantin', active: true, stock: 40 },
 { id: 'p6', name: 'Nasi Telur', price: 9000, category: 'Kantin', active: true, stock: 25 },
 { id: 'p7', name: 'Buku Tulis', price: 6500, category: 'Koperasi', active: true, stock: 45 },
 { id: 'p8', name: 'Pulpen', price: 3000, category: 'Koperasi', active: true, stock: 65 },
 { id: 'p9', name: 'Sabun Mandi', price: 7000, category: 'Koperasi', active: true, stock: 35 },
 { id: 'p10', name: 'Pasta Gigi', price: 8500, category: 'Koperasi', active: true, stock: 25 },
 { id: 'p11', name: 'Susu Kotak', price: 6000, category: 'Kantin', active: true, stock: 30 },
 { id: 'p12', name: 'Snack', price: 4000, category: 'Kantin', active: true, stock: 70 },
];
export const initialStore = (): Store => ({ products: initialProducts.map(p => ({...p})), students: initialStudents.map(s => ({...s})), sales: [], withdrawals: [], cashier: 'Kasir Koperasi' });
export function rp(value: number): string { return 'Rp' + Math.max(0, Math.round(value)).toLocaleString('id-ID'); }
export function num(value: number): string { return Math.round(value).toLocaleString('id-ID'); }
export function parseNominal(text: string): number { return Number(text.replace(/\D/g,'')) || 0; }
export function dayKey(value: Date | string | number = new Date()): string { const d = new Date(value); if(Number.isNaN(d.getTime()))return ''; const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d); const find=(type:string)=>parts.find(x=>x.type===type)?.value||'';return `${find('year')}-${find('month')}-${find('day')}`; }
export function fmtDate(value: string, withTime = true): string { const d = new Date(value); return Number.isNaN(d.getTime()) ? '-' : new Intl.DateTimeFormat('id-ID', { timeZone:'Asia/Jakarta', day:'2-digit', month:'short', year:'numeric', ...(withTime ? {hour:'2-digit', minute:'2-digit', hour12:false} : {}) }).format(d) + (withTime?' WIB':''); }
export function fmtTime(value: string): string { const d = new Date(value); return Number.isNaN(d.getTime()) ? '-' : new Intl.DateTimeFormat('id-ID', {timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',hour12:false}).format(d); }
export function uid(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`; }
export function safeArray(value: unknown): unknown[] {return Array.isArray(value)?value:[];}
export function readDepositHistory(): Array<{createdAt:string;depositAmount:number;bankId:string}> {
 if (typeof window === 'undefined') return [];
 let list: unknown[] = [];
 try { list = safeArray(JSON.parse(localStorage.getItem(KEY.deposits) || '[]')); } catch {}
 try { const raw=sessionStorage.getItem(KEY.receipt); if(raw) list.push(JSON.parse(raw)); } catch {}
 const unique = new Map<string,{createdAt:string;depositAmount:number;bankId:string}>();
 for(const e of list){
  if(!e||typeof e!=='object')continue;
  const x=e as Record<string,unknown>;
  if(x.isDemo!==true||typeof x.bankId!=='string'||typeof x.createdAt!=='string'||!Number.isFinite(Date.parse(x.createdAt))||typeof x.depositAmount!=='number'||!Number.isSafeInteger(x.depositAmount)||x.depositAmount<20000||x.adminFee!==5000||x.totalPayment!==x.depositAmount+5000)continue;
  unique.set(`${x.createdAt}|${x.bankId}|${x.depositAmount}`,{createdAt:x.createdAt,depositAmount:x.depositAmount,bankId:x.bankId});
 }
 return [...unique.values()];
}
export function walletTopUps(studentId:string): number { return studentId==='20260001' ? readDepositHistory().reduce((s,t)=>s+t.depositAmount,0):0; }
export function studentLimit(student: Student):number {
 if(student.id!=='20260001'||typeof window==='undefined')return student.dailyLimit;
 try {
  const raw=localStorage.getItem(KEY.limit);
  if(raw!==null){
   let value:number=NaN;
   try {const parsed:unknown=JSON.parse(raw); if(typeof parsed==='object'&&parsed!==null&&'limit' in parsed){value=Number((parsed as {limit:unknown}).limit);}else{value=Number(parsed);}}catch{value=Number(raw);}
   if(Number.isSafeInteger(value)&&value>0&&value<=100000000)return value;
  }
 }catch{}
 return student.dailyLimit;
}
export function totalSpent(store: Store, studentId: string):number {return store.sales.filter(s=>s.studentId===studentId).reduce((n,s)=>n+s.total,0);}
export function todaySpent(store:Store, studentId:string):number {const day=dayKey();return store.sales.filter(s=>s.studentId===studentId&&dayKey(s.time)===day).reduce((n,s)=>n+s.total,0);}
export function studentBalance(store:Store, student:Student):number {return Math.max(0,student.openingBalance+walletTopUps(student.id)-totalSpent(store,student.id));}
export function totalSales(store:Store):number{return store.sales.reduce((s,t)=>s+t.total,0);}
export function withdrawn(store:Store):number{return store.withdrawals.reduce((s,t)=>s+t.amount,0);}
export function availableSettlement(store:Store):number{return Math.max(0,totalSales(store)-withdrawn(store));}
export function withdrawnToday(store:Store):boolean{return store.withdrawals.some(w=>dayKey(w.time)===dayKey());}
export function csvDownload(name:string, headers:string[], rows:(string|number)[][]) {
 const esc=(s:string|number)=>{const str=String(s).replace(/^([=+@\-\t\r])/,'\'$1');return '"'+str.replaceAll('"','""')+'"';};
 const csv='\uFEFF'+[headers,...rows].map(row=>row.map(esc).join(',')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
}
