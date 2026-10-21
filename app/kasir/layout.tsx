import type { ReactNode } from 'react';
import { KasirProvider } from './components/KasirProvider';
import { KasirShell } from './components/KasirShell';
import './kasir.css';
export const metadata={title:'Kasir | DOSI Pay'};
export default function Layout({children}:{children:ReactNode}){return <KasirProvider><KasirShell>{children}</KasirShell></KasirProvider>}
