// DOSI Pay · Manajemen Pondok | data demo browser-lokal.
// Modul ini tidak memindahkan dana, menerbitkan VA, atau mengelola biometrik asli.
export const KEYS = {
  kasir: 'dosi_kasir_store_v1',
  deposits: 'dosi_demo_deposit_history',
  receipt: 'dosi_demo_deposit_receipt',
  limit: 'dosi_wali_daily_snack_limit_v1',
  sppWali: 'dosi_demo_spp_spp-demo-001',
  messages: 'dosi_wali_santri_messages_demo_v1',
  admin: 'dosi_manajemen_store_v1',
} as const;
export type Category = 'Kantin' | 'Koperasi' | 'Lainnya';
export type Student = {id:string;name:string;className:string;initial:string;openingBalance:number;dailyLimit:number};
export type Product = {id:string;name:string;price:number;category:Category;active:boolean;stock:number|null};
export type SaleLine={name:string;category:Category;qty:number;price:number;itemId?:string};
export type Sale={id:string;time:string;studentId:string;studentName:string;cashier:string;lines:SaleLine[];total:number;biometric:string;status:string};
export type Withdrawal={id:string;time:string;amount:number;cashier:string;note:string;status:string};
export type KasirStore={products:Product[];students:Student[];sales:Sale[];withdrawals:Withdrawal[];cashier:string};
export type AdminUser={id:string;name:string;username:string;role:'Manajemen'|'Kasir'|'Wali';studentId?:string;active:boolean};
export type Announcement={id:string;title:string;category:'Umum'|'Akademik'|'Kegiatan'|'Keuangan';body:string;createdAt:string;status:'Terbit'|'Draf'};
export type Bill={id:string;studentId:string;period:string;amount:number;dueDate:string;payments:{id:string;amount:number;createdAt:string;note:string}[]};
export type AuditEvent={id:string;time:string;action:string;detail:string;actor:string};
export type Policy={dailyLimit:number;withdrawalFrequency:'daily';withdrawalDay:'any'|'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday';biometricRequired:boolean;schoolName:string;adminName:string};
export type AdminStore={users:AdminUser[];announcements:Announcement[];bills:Bill[];audits:AuditEvent[];reconciledWithdrawalIds:string[];disabledStudents:string[];policy:Policy};
export type Deposit={key:string;createdAt:string;depositAmount:number;bankId:string;bankName:string;adminFee:number};
export type Activity={id:string;type:'Deposit'|'Belanja'|'SPP'|'Penarikan';time:string;name:string;detail:string;amount:number};
export const rp=(n:number)=>'Rp'+Math.max(0,Math.round(n||0)).toLocaleString('id-ID');
export const fmt=(v:string,withTime=true)=>{const d=new Date(v);return Number.isNaN(d.getTime())?'-':new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'short',year:'numeric',...(withTime?{hour:'2-digit',minute:'2-digit',hour12:false}:{})}).format(d)+(withTime?' WIB':'')};
export const dayKey=(value:string|number|Date=new Date())=>{const d=new Date(value);if(Number.isNaN(d.getTime()))return '';const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jakarta',day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(d);const f=(t:string)=>p.find(x=>x.type===t)?.value||'';return `${f('year')}-${f('month')}-${f('day')}`};
export const uid=(prefix:string)=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
export function rawJson(key:string):unknown {try{if(typeof window==='undefined')return null;const s=localStorage.getItem(key);return s?JSON.parse(s):null}catch{return null}}
const sampleStudents:Student[]=[
 {id:'20260001',name:'Ahmad Fauzan',className:'VIII A',initial:'AF',openingBalance:275000,dailyLimit:25000},
 {id:'20260002',name:'Rizky Maulana',className:'VIII B',initial:'RM',openingBalance:185000,dailyLimit:35000},
 {id:'20260003',name:'Nabila Zahra',className:'VII A',initial:'NZ',openingBalance:310000,dailyLimit:40000},
 {id:'20260004',name:'Fadhil Ramadhan',className:'IX A',initial:'FR',openingBalance:95000,dailyLimit:30000},
 {id:'20260005',name:'Alya Putri',className:'VII B',initial:'AP',openingBalance:145000,dailyLimit:30000},
 {id:'20260006',name:'Ilham Saputra',className:'IX B',initial:'IS',openingBalance:120000,dailyLimit:25000},
];
const sampleProducts:Product[]=[
 {id:'p1',name:'Nasi Ayam',price:12000,category:'Kantin',active:true,stock:30},{id:'p2',name:'Mie Goreng',price:10000,category:'Kantin',active:true,stock:35},
 {id:'p3',name:'Roti Coklat',price:5000,category:'Kantin',active:true,stock:50},{id:'p4',name:'Air Mineral',price:3000,category:'Kantin',active:true,stock:80},
 {id:'p5',name:'Es Teh',price:4000,category:'Kantin',active:true,stock:40},{id:'p6',name:'Buku Tulis',price:6500,category:'Koperasi',active:true,stock:45},
];
export const initialKasir=():KasirStore=>({products:sampleProducts,students:sampleStudents,sales:[],withdrawals:[],cashier:'Kasir Koperasi'});
export const initialAdmin=():AdminStore=>({
 users:[{id:'u1',name:'Admin Pondok',username:'admin_demo',role:'Manajemen',active:true},{id:'u2',name:'Kasir Koperasi',username:'kasir_demo',role:'Kasir',active:true},{id:'u3',name:'Wali Ahmad Fauzan',username:'wali_ahmad',role:'Wali',studentId:'20260001',active:true}],
 announcements:[{id:'ann-1',title:'Jadwal Kunjungan Wali Santri',category:'Kegiatan',body:'Kunjungan wali dilaksanakan pada 10 Oktober 2026.',createdAt:'2026-10-07T08:00:00+07:00',status:'Terbit'}],
 bills:[{id:'spp-demo-001',studentId:'20260001',period:'SPP Tahun Ajaran 2026/2027',amount:1200000,dueDate:'2027-06-30',payments:[]}],
 audits:[],reconciledWithdrawalIds:[],disabledStudents:[],
 policy:{dailyLimit:25000,withdrawalFrequency:'daily',withdrawalDay:'any',biometricRequired:true,schoolName:'Pondok Pesantren DOSI',adminName:'Admin Pondok'},
});
function validArr<T>(x:unknown,fallback:T[]):T[]{return Array.isArray(x)?x as T[]:fallback}
export function readKasir():KasirStore{
 const p=rawJson(KEYS.kasir);const d=initialKasir();if(!p||typeof p!=='object')return d;
 const v=p as Partial<KasirStore>;return {products:validArr(v.products,d.products),students:validArr(v.students,d.students),sales:validArr(v.sales,d.sales),withdrawals:validArr(v.withdrawals,d.withdrawals),cashier:typeof v.cashier==='string'?v.cashier:d.cashier};
}
export function readAdmin():AdminStore{
 const p=rawJson(KEYS.admin);const d=initialAdmin();if(!p||typeof p!=='object')return d;const v=p as Partial<AdminStore>;
 return {users:validArr(v.users,d.users),announcements:validArr(v.announcements,d.announcements),bills:validArr(v.bills,d.bills),audits:validArr(v.audits,d.audits),reconciledWithdrawalIds:validArr(v.reconciledWithdrawalIds,d.reconciledWithdrawalIds),disabledStudents:validArr(v.disabledStudents,d.disabledStudents),policy:{...d.policy,...(v.policy&&typeof v.policy==='object'?v.policy:{})}};
}
export function deposits():Deposit[]{
 if(typeof window==='undefined')return [];
 const r=rawJson(KEYS.deposits);let rows:unknown[]=Array.isArray(r)?r:[];
 try{const latest=sessionStorage.getItem(KEYS.receipt);if(latest)rows=[...rows,JSON.parse(latest)]}catch{}
 const distinct=new Map<string,Deposit>();for(const x of rows){if(!x||typeof x!=='object')continue;const v=x as Record<string,unknown>;
  if(v.isDemo!==true||typeof v.bankId!=='string'||typeof v.createdAt!=='string'||!Number.isFinite(Date.parse(v.createdAt))||typeof v.depositAmount!=='number'||!Number.isSafeInteger(v.depositAmount)||v.depositAmount<20000||v.adminFee!==5000||v.totalPayment!==v.depositAmount+5000)continue;
  const key=`${v.createdAt}|${v.bankId}|${v.depositAmount}`;distinct.set(key,{key,createdAt:v.createdAt,depositAmount:v.depositAmount,bankId:v.bankId,bankName:typeof v.bankName==='string'?v.bankName:v.bankId,adminFee:5000});
 }return [...distinct.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
export function waliSppPayments():Bill['payments']{
 const p=rawJson(KEYS.sppWali);if(!Array.isArray(p))return [];
 const seen=new Set<string>();let total=0;const result:Bill['payments']=[];
 for(const x of [...p].sort((a,b)=>String(a?.createdAt).localeCompare(String(b?.createdAt)))){
  if(!x||typeof x!=='object'||x.isDemo!==true||typeof x.id!=='string'||seen.has(x.id)||typeof x.amount!=='number'||!Number.isSafeInteger(x.amount)||x.amount<=0||typeof x.createdAt!=='string'||!Number.isFinite(Date.parse(x.createdAt))||total+x.amount>1200000)continue;
  seen.add(x.id);total+=x.amount;result.push({id:x.id,amount:x.amount,createdAt:x.createdAt,note:`Bank ${String(x.bankId||'demo')}`});
 }return result;
}
export function billPayments(bill:Bill):Bill['payments']{
 const external=bill.id==='spp-demo-001'?waliSppPayments():[];
 const map=new Map<string,Bill['payments'][number]>();[...external,...bill.payments].forEach(p=>map.set(p.id,p));return [...map.values()];
}
export const billPaid=(b:Bill)=>billPayments(b).reduce((s,p)=>s+p.amount,0);
export const spentStudent=(k:KasirStore,id:string)=>k.sales.filter(s=>s.studentId===id).reduce((n,s)=>n+s.total,0);
export const spentToday=(k:KasirStore,id:string)=>k.sales.filter(s=>s.studentId===id&&dayKey(s.time)===dayKey()).reduce((n,s)=>n+s.total,0);
export function effectiveLimit(s:Student):number{
 if(s.id!=='20260001'||typeof window==='undefined')return s.dailyLimit;
 try{const raw=localStorage.getItem(KEYS.limit);if(raw===null)return s.dailyLimit;let a:unknown;try{a=JSON.parse(raw)}catch{a=raw}const val=typeof a==='object'&&a!==null&&'limit' in a?Number((a as {limit:unknown}).limit):Number(a);return Number.isSafeInteger(val)&&val>0&&val<=100000000?val:s.dailyLimit}catch{return s.dailyLimit}
}
export function balanceOf(k:KasirStore,s:Student,topUps:Deposit[]):number{return Math.max(0,s.openingBalance+(s.id==='20260001'?topUps.reduce((n,d)=>n+d.depositAmount,0):0)-spentStudent(k,s.id))}
export const salesSum=(k:KasirStore)=>k.sales.reduce((s,v)=>s+v.total,0);
export const withdrawSum=(k:KasirStore)=>k.withdrawals.reduce((s,v)=>s+v.amount,0);
export const availableSettlement=(k:KasirStore)=>Math.max(0,salesSum(k)-withdrawSum(k));
export function activity(k:KasirStore,ds:Deposit[],a:AdminStore):Activity[]{
 const rows:Activity[]=[...ds.map(d=>({id:d.key,type:'Deposit' as const,time:d.createdAt,name:'Ahmad Fauzan',detail:`${d.bankName} · Demo`,amount:d.depositAmount})),...k.sales.map(s=>({id:s.id,type:'Belanja' as const,time:s.time,name:s.studentName,detail:`${s.cashier} · ${s.lines.length} baris`,amount:s.total})),...k.withdrawals.map(w=>({id:w.id,type:'Penarikan' as const,time:w.time,name:w.cashier,detail:w.note||'Koperasi',amount:w.amount}))];
 a.bills.forEach(b=>billPayments(b).forEach(p=>rows.push({id:p.id,type:'SPP',time:p.createdAt,name:k.students.find(s=>s.id===b.studentId)?.name||b.studentId,detail:b.period,amount:p.amount})));
 return rows.sort((x,y)=>y.time.localeCompare(x.time));
}
export function exportCSV(name:string,headers:string[],rows:(string|number)[][]){
 const esc=(v:string|number)=>'"'+String(v).replace(/^([=+@\-\t\r])/,'\'$1').replaceAll('"','""')+'"';const csv='\uFEFF'+[headers,...rows].map(r=>r.map(esc).join(',')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),600);
}
