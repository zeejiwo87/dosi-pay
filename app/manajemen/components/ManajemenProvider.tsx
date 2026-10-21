'use client';
import {createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import {KEYS,initialAdmin,initialKasir,readAdmin,readKasir,deposits,uid, billPaid, type AdminStore,type KasirStore,type AdminUser,type Student,type Product,type Bill,type Announcement,type Policy,type Deposit} from '../lib/data';

type ContextValue={
 admin:AdminStore;kasir:KasirStore;deposits:Deposit[];ready:boolean;refresh:()=>void;
 saveUser:(u:AdminUser)=>boolean;saveStudent:(s:Student)=>boolean;saveProduct:(p:Product)=>boolean;removeProduct:(id:string)=>boolean;
 saveBill:(b:Bill)=>boolean;payBill:(id:string,amount:number,note:string)=>{ok:boolean;error?:string};
 saveAnnouncement:(a:Announcement)=>boolean;deleteAnnouncement:(id:string)=>boolean;
 savePolicy:(policy:Policy)=>boolean;reconcile:(id:string)=>boolean;recordAudit:(action:string,detail:string)=>boolean;
 resetAdmin:()=>boolean;
};
const Context=createContext<ContextValue|null>(null);
export function ManajemenProvider({children}:{children:ReactNode}){
 const [admin,setAdmin]=useState<AdminStore>(initialAdmin());
 const [kasir,setKasir]=useState<KasirStore>(initialKasir());
 const [topups,setTopups]=useState<Deposit[]>([]);
 const [ready,setReady]=useState(false);
 const refresh=useCallback(()=>{setAdmin(readAdmin());setKasir(readKasir());setTopups(deposits());setReady(true);},[]);
 useEffect(()=>{
  refresh();const onStorage=(e:StorageEvent)=>{if(!e.key||([KEYS.admin,KEYS.kasir,KEYS.deposits,KEYS.sppWali,KEYS.limit] as string[]).includes(e.key))refresh();};
  window.addEventListener('storage',onStorage);window.addEventListener('focus',refresh);
  return ()=>{window.removeEventListener('storage',onStorage);window.removeEventListener('focus',refresh)};
 },[refresh]);
 const persistAdmin=useCallback((apply:(previous:AdminStore)=>AdminStore,action:string,detail:string)=>{
  try{const current=readAdmin();const next=apply(current);next.audits=[{id:uid('AUD'),time:new Date().toISOString(),action,detail,actor:next.policy.adminName||'Admin Pondok'},...current.audits].slice(0,700);
   localStorage.setItem(KEYS.admin,JSON.stringify(next));setAdmin(next);return true;
  }catch{return false;}
 },[]);
 const persistKasir=useCallback((apply:(previous:KasirStore)=>KasirStore,action:string,detail:string)=>{
  try{const next=apply(readKasir());localStorage.setItem(KEYS.kasir,JSON.stringify(next));setKasir(next);persistAdmin(p=>p,action,detail);return true;}catch{return false;}
 },[persistAdmin]);
 const recordAudit=useCallback((action:string,detail:string)=>persistAdmin(x=>x,action,detail),[persistAdmin]);
 const saveUser=useCallback((u:AdminUser)=>persistAdmin(x=>({...x,users:x.users.some(p=>p.id===u.id)?x.users.map(p=>p.id===u.id?u:p):[u,...x.users]}),'Pengguna',`${u.name} · ${u.role} · ${u.active?'Aktif':'Nonaktif'}`),[persistAdmin]);
 const saveStudent=useCallback((s:Student)=>{
  const ok=persistKasir(x=>({...x,students:x.students.some(p=>p.id===s.id)?x.students.map(p=>p.id===s.id?s:p):[s,...x.students]}),'Santri',`${s.name} · NIS ${s.id}`);
  if(ok&&s.id==='20260001'){try{localStorage.setItem(KEYS.limit,JSON.stringify({limit:s.dailyLimit,updatedAt:new Date().toISOString()}));}catch{}}
  return ok;
 },[persistKasir]);
 const saveProduct=useCallback((p:Product)=>persistKasir(x=>({...x,products:x.products.some(v=>v.id===p.id)?x.products.map(v=>v.id===p.id?p:v):[p,...x.products]}),'Produk',`${p.name} · ${p.price}`),[persistKasir]);
 const removeProduct=useCallback((id:string)=>persistKasir(x=>({...x,products:x.products.filter(v=>v.id!==id)}),'Produk',`Hapus produk ${id}`),[persistKasir]);
 const saveBill=useCallback((b:Bill)=>persistAdmin(x=>({...x,bills:x.bills.some(v=>v.id===b.id)?x.bills.map(v=>v.id===b.id?b:v):[b,...x.bills]}),'Tagihan SPP',`${b.studentId} · ${b.period}`),[persistAdmin]);
 const payBill=useCallback((id:string,amount:number,note:string)=>{
  const bill=readAdmin().bills.find(b=>b.id===id);
  if(!bill)return {ok:false,error:'Tagihan tidak ditemukan.'};
  if(!Number.isSafeInteger(amount)||amount<=0||amount>bill.amount-billPaid(bill))return {ok:false,error:'Nominal melebihi sisa tagihan.'};
  const receipt={id:uid('SPP'),amount,createdAt:new Date().toISOString(),note:note.trim()||'Dicatat manajemen (demo)'};
  const ok=persistAdmin(x=>({...x,bills:x.bills.map(b=>b.id===id?{...b,payments:[...b.payments,receipt]}:b)}),'Cicilan SPP',`${bill.studentId} · Rp${amount}`);
  return {ok,...(!ok?{error:'Gagal menyimpan cicilan.'}:{})};
 },[persistAdmin]);
 const saveAnnouncement=useCallback((a:Announcement)=>persistAdmin(x=>({...x,announcements:x.announcements.some(v=>v.id===a.id)?x.announcements.map(v=>v.id===a.id?a:v):[a,...x.announcements]}),'Pengumuman',`${a.status} · ${a.title}`),[persistAdmin]);
 const deleteAnnouncement=useCallback((id:string)=>persistAdmin(x=>({...x,announcements:x.announcements.filter(a=>a.id!==id)}),'Pengumuman',`Hapus pengumuman ${id}`),[persistAdmin]);
 const savePolicy=useCallback((policy:Policy)=>persistAdmin(x=>({...x,policy}),'Kebijakan','Pengaturan manajemen diperbarui'),[persistAdmin]);
 const reconcile=useCallback((id:string)=>persistAdmin(x=>({...x,reconciledWithdrawalIds:x.reconciledWithdrawalIds.includes(id)?x.reconciledWithdrawalIds:[id,...x.reconciledWithdrawalIds]}),'Rekonsiliasi',`Penarikan ${id}`),[persistAdmin]);
 const resetAdmin=useCallback(()=>{try{localStorage.removeItem(KEYS.admin);refresh();return true;}catch{return false;}},[refresh]);
 const value=useMemo<ContextValue>(()=>({admin,kasir,deposits:topups,ready,refresh,saveUser,saveStudent,saveProduct,removeProduct,saveBill,payBill,saveAnnouncement,deleteAnnouncement,savePolicy,reconcile,recordAudit,resetAdmin}),[admin,kasir,topups,ready,refresh,saveUser,saveStudent,saveProduct,removeProduct,saveBill,payBill,saveAnnouncement,deleteAnnouncement,savePolicy,reconcile,recordAudit,resetAdmin]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useManajemen(){const ctx=useContext(Context);if(!ctx)throw new Error('ManajemenProvider belum tersedia');return ctx;}
