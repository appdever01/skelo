import type { ReactNode } from 'react';
import 'react-loading-regions/styles.css';
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
