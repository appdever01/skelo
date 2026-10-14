import { LoadingRegion } from 'react-loading-regions/next';
import { pending, ready } from 'react-loading-regions/core';
import ClientDemo from './client-demo';
export default function Page() {
  return <main><h1>Skelo in Next.js</h1>
    <LoadingRegion id="server-ready" resource={ready('Server content')}><p>Server content</p></LoadingRegion>
    <LoadingRegion id="server-pending" resource={pending()} fallback={<p>Server placeholder</p>}><p>Must stay unmounted</p></LoadingRegion>
    <ClientDemo initialName="Alex" />
  </main>;
}
