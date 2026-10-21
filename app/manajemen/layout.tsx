import type {ReactNode} from 'react';
import {ManajemenProvider} from './components/ManajemenProvider';
import {ManajemenShell} from './components/ManajemenShell';
import './manajemen.css';
export const metadata={title:'Manajemen Pondok | DOSI Pay',description:'Dashboard operasional pesantren (demo)'};
export default function Layout({children}:{children:ReactNode}){return <ManajemenProvider><ManajemenShell>{children}</ManajemenShell></ManajemenProvider>}
