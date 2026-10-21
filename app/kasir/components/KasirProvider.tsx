'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { KEY, initialStore, type Sale, type Store, type Withdrawal, type Item, type Student, readDepositHistory, uid, studentBalance, studentLimit, todaySpent, availableSettlement, withdrawnToday } from '../lib/data';

const EMPTY = initialStore();
type SaleInput={studentId:string;lines:Sale['lines']};
type Result = {ok:true;record:Sale|Withdrawal}|{ok:false;error:string};
type ContextType={store:Store;ready:boolean;version:number;saveProduct:(product:Item)=>void;deleteProduct:(id:string)=>void;saveStudent:(student:Student)=>void;saveCashier:(name:string)=>void;createSale:(input:SaleInput)=>Result;createWithdrawal:(amount:number,note:string)=>Result;resetDemo:()=>void;refresh:()=>void};
const Context = createContext<ContextType|null>(null);
function safeRead():Store{
 try{
  const raw=localStorage.getItem(KEY.store);if(!raw)return initialStore();
  const parsed:unknown=JSON.parse(raw);
  if(!parsed||typeof parsed!=='object')return initialStore();
  const x=parsed as Record<string,unknown>;
  if(!Array.isArray(x.products)||!Array.isArray(x.students)||!Array.isArray(x.sales)||!Array.isArray(x.withdrawals))return initialStore();
  return {products:x.products as Item[],students:x.students as Student[],sales:x.sales as Sale[],withdrawals:x.withdrawals as Withdrawal[],cashier:typeof x.cashier==='string'?x.cashier:'Kasir Koperasi'};
 }catch{return initialStore();}
}
export function KasirProvider({children}:{children:ReactNode}){
 const [store,setStore]=useState<Store>(EMPTY);
 const [ready,setReady]=useState(false);
 const [version,setVersion]=useState(0);
 const refresh=useCallback(()=>{setStore(safeRead());setVersion(v=>v+1);},[]);
 useEffect(()=>{
  refresh();setReady(true);
  const onStorage=(e:StorageEvent)=>{if(!e.key||([KEY.store,KEY.deposits,KEY.limit] as string[]).includes(e.key))refresh();};
  window.addEventListener('storage',onStorage);
  window.addEventListener('focus',refresh);
  return()=>{window.removeEventListener('storage',onStorage);window.removeEventListener('focus',refresh);};
 },[refresh]);
 const persist=(change:(value:Store)=>Store):boolean=>{
  try{const next=change(safeRead());localStorage.setItem(KEY.store,JSON.stringify(next));setStore(next);setVersion(v=>v+1);return true;}catch{return false;}
 };
 const saveProduct=(product:Item)=>{persist(s=>({...s,products:s.products.some(p=>p.id===product.id)?s.products.map(p=>p.id===product.id?product:p):[product,...s.products]}));};
 const deleteProduct=(id:string)=>{persist(s=>({...s,products:s.products.filter(p=>p.id!==id)}));};
 const saveStudent=(student:Student)=>{persist(s=>({...s,students:s.students.map(x=>x.id===student.id?student:x)}));};
 const saveCashier=(name:string)=>{persist(s=>({...s,cashier:name.trim()||'Kasir Koperasi'}));};
 const createSale=({studentId,lines}:SaleInput):Result=>{
  let result:Result={ok:false,error:'Transaksi gagal disimpan.'};
  const done=persist(s=>{
   const student=s.students.find(st=>st.id===studentId);
   if(!student){result={ok:false,error:'Pilih santri terlebih dahulu.'};return s;}
   if(!lines.length){result={ok:false,error:'Masukkan nominal atau produk.'};return s;}
   if(lines.some(l=>!Number.isSafeInteger(l.qty)||l.qty<1||!Number.isSafeInteger(l.price)||l.price<1||!l.name.trim())){result={ok:false,error:'Rincian transaksi tidak valid.'};return s;}
   const total=lines.reduce((n,l)=>n+l.price*l.qty,0);
   if(!Number.isSafeInteger(total)||total<=0){result={ok:false,error:'Total transaksi tidak valid.'};return s;}
   if(total>studentBalance(s,student)){result={ok:false,error:'Saldo santri tidak mencukupi.'};return s;}
   if(total>Math.max(0,studentLimit(student)-todaySpent(s,student.id))){result={ok:false,error:'Transaksi melebihi sisa limit harian santri.'};return s;}
   const counts = new Map<string,number>();
   for(const l of lines){if(l.itemId)counts.set(l.itemId,(counts.get(l.itemId)||0)+l.qty);}
   for(const [id,qty] of counts){const p=s.products.find(p=>p.id===id);if(!p||!p.active){result={ok:false,error:'Produk tidak tersedia.'};return s;}if(p.stock!==null&&p.stock<qty){result={ok:false,error:`Stok ${p.name} tidak cukup.`};return s;}}
   const sale:Sale={id:uid('TRX'),time:new Date().toISOString(),studentId,studentName:student.name,cashier:s.cashier,lines:lines.map(l=>({...l})),total,biometric:'demo-verified',status:'paid'};
   result={ok:true,record:sale};
   return {...s,sales:[sale,...s.sales],products:s.products.map(p=>p.stock===null?p:({...p,stock:Math.max(0,p.stock-(counts.get(p.id)||0))}))};
  });
  if(!done)return {ok:false,error:'Penyimpanan browser penuh atau tidak tersedia.'};
  const outcome = result as Result;
  if(outcome.ok){try{sessionStorage.setItem(KEY.lastSale,JSON.stringify(outcome.record));}catch{}}
  return outcome;
 };
 const createWithdrawal=(amount:number,note:string):Result=>{
  let result:Result={ok:false,error:'Gagal mencatat penarikan.'};
  const done=persist(s=>{
   if(withdrawnToday(s)){result={ok:false,error:'Penarikan sudah dilakukan hari ini. Coba besok.'};return s;}
   if(!Number.isSafeInteger(amount)||amount<=0){result={ok:false,error:'Nominal harus lebih dari Rp0.'};return s;}
   if(amount>availableSettlement(s)){result={ok:false,error:'Nominal melebihi saldo yang dapat ditarik.'};return s;}
   const w:Withdrawal={id:uid('WD'),time:new Date().toISOString(),amount,note:note.trim(),cashier:s.cashier,status:'recorded-demo'};
   result={ok:true,record:w};
   return {...s,withdrawals:[w,...s.withdrawals]};
  });
  return done?result:{ok:false,error:'Penyimpanan browser gagal.'};
 };
 const resetDemo=()=>{try{localStorage.removeItem(KEY.store);sessionStorage.removeItem(KEY.lastSale);refresh();}catch{}};
 const value=useMemo<ContextType>(()=>({store,ready,version,saveProduct,deleteProduct,saveStudent,saveCashier,createSale,createWithdrawal,resetDemo,refresh}),[store,ready,version,refresh]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useKasir(){const x=useContext(Context);if(!x)throw new Error('KasirProvider missing');return x;}
