import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LoadingRegion, pending, ready, refreshing, failed, hasData, type Resource } from 'react-loading-regions';
import { QualityBoundary } from 'react-loading-regions/quality/react';
import type { QualityReport } from 'react-loading-regions/quality';
import 'react-loading-regions/styles.css';
import './style.css';

type IdentityData = { name: string; bio: string };
type ActivityData = { title: string; time: string }[];
const exampleIdentity: IdentityData = { name: 'Alex Morgan', bio: 'Product designer in Lagos' };
const exampleActivity: ActivityData = [
  { title: 'Shared the project outline', time: '10:42' },
  { title: 'Updated the profile photo', time: '09:15' },
  { title: 'Joined the design team', time: 'Yesterday' },
];
const qualityOptions = { scan: { maxScanMs: 32 } };

function Identity({ name, bio }: IdentityData) {
  return <div className="identity">
    <div className="avatar" data-loading-key="avatar" data-skeleton-shape="circle">AM</div>
    <div><h2 data-loading-key="name">{name}</h2><p data-loading-key="bio">{bio}</p></div>
  </div>;
}

function Activity({ items }: { items: ActivityData }) {
  return <ul className="activity-list">{items.map((item, i) => <li key={i}>
    <span data-loading-key={`activity-${i}`}>{item.title}</span><time data-loading-key={`time-${i}`}>{item.time}</time>
  </li>)}</ul>;
}

function Playground() {
  const [identity, setIdentity] = useState<Resource<IdentityData>>(pending());
  const [activity, setActivity] = useState<Resource<ActivityData>>(pending());
  const [reports, setReports] = useState<Record<string, QualityReport>>({});
  const [longContent, setLongContent] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [actionCount, setActionCount] = useState(0);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const active = timers.current;
    return () => { for (const timer of active.values()) clearTimeout(timer); };
  }, []);
  function schedule(key: string, fn: () => void, ms: number) {
    clearTimeout(timers.current.get(key));
    timers.current.set(key, setTimeout(() => { timers.current.delete(key); fn(); }, ms));
  }
  const identityValue = longContent ? { name: 'Alexandria Morgan-Olufemi', bio: 'Product designer working with research teams across Lagos, Berlin and São Paulo' } : exampleIdentity;
  function loadIdentity() { schedule('identity', () => setIdentity(ready(identityValue)), 900); }
  function loadActivity() { schedule('activity', () => setActivity(ready(exampleActivity)), 1800); }
  function reset() {
    for (const timer of timers.current.values()) clearTimeout(timer);
    timers.current.clear();
    setIdentity(pending()); setActivity(pending()); setReports({});
  }
  function updateIdentity() {
    if (!hasData(identity)) return;
    setIdentity(refreshing(identity.data));
    schedule('identity', () => setIdentity(ready(identityValue)), 1200);
  }
  function failActivity() {
    clearTimeout(timers.current.get('activity'));
    setActivity(failed('Simulated request failure'));
  }
  return <main>
    <header><a className="wordmark" href="https://github.com/appdever01/skelo">Skelo</a><span className="version">0.1.0</span></header>
    <h1>Load each part.<br />Check what moves.</h1>
    <div className="workspace">
      <section aria-labelledby="preview-heading">
        <div className="section-head"><h2 id="preview-heading">Preview</h2><button type="button" onClick={reset}>Reset</button></div>
        <QualityBoundary options={qualityOptions} onReport={report => setReports(previous => ({ ...previous, [report.regionId]: report }))}>
          <div className="profile" dir={rtl ? 'rtl' : 'ltr'}>
            <LoadingRegion id="identity" resource={identity} template={<Identity {...exampleIdentity} />}>
              {data => <Identity {...data} />}
            </LoadingRegion>
            <div className="activity-heading"><h3>Recent activity</h3><span>{activity.status}</span></div>
            <LoadingRegion id="activity" resource={activity} template={<Activity items={exampleActivity} />}
              onRetry={() => { setActivity(pending()); loadActivity(); }}>
              {items => <Activity items={items} />}
            </LoadingRegion>
            <button type="button" className="message-button" onClick={() => setActionCount(count => count + 1)}>Try an available action</button>
          </div>
        </QualityBoundary>
        <p className="demo-note">Synthetic data. Requests are simulated locally.</p>
        <p className="demo-note" role="status">{actionCount ? `Action used ${actionCount} ${actionCount === 1 ? 'time' : 'times'} while regions load independently.` : ''}</p>
      </section>
      <aside aria-label="Loading controls">
        <h2>Controls</h2>
        <div className="control-row"><span>Profile</span><span className="state">{identity.status}</span><button type="button" onClick={loadIdentity}>Load profile</button></div>
        <div className="control-row"><span>Activity</span><span className="state">{activity.status}</span><button type="button" onClick={loadActivity}>Load activity</button></div>
        <div className="actions"><button type="button" disabled={!hasData(identity)} onClick={updateIdentity}>Refresh profile</button><button type="button" onClick={failActivity}>Fail activity</button></div>
        <label className="toggle"><input type="checkbox" checked={longContent} onChange={e => setLongContent(e.target.checked)} />Load longer content</label>
        <label className="toggle"><input type="checkbox" checked={rtl} onChange={e => { reset(); setRtl(e.target.checked); }} />Preview right-to-left layout</label>
      </aside>
    </div>
    <section className="reports" aria-labelledby="quality-heading">
      <div className="section-head"><h2 id="quality-heading">Layout checks</h2><span>Default tolerance: 8px</span></div>
      {Object.values(reports).length ? <ul>{Object.values(reports).map(report => <li key={report.regionId}>
        <div className="report-head"><strong>{report.regionId}</strong><span className={report.passed ? 'pass' : 'issue'}>{report.passed ? 'Within tolerance' : report.comparable ? 'Mismatch' : 'Not comparable'}</span></div>
        {report.issues.length ? <ul>{report.issues.map((issue, i) => <li key={i}><code>{issue.code}</code> {issue.message}{issue.deltaPx !== undefined ? ` (${issue.deltaPx.toFixed(1)}px)` : ''}</li>)}</ul> : <p>Compared {report.metrics.actualBones} elements. Largest difference: {report.metrics.maxDriftPx.toFixed(1)}px.</p>}
      </li>)}</ul> : <p>Load a region to compare its skeleton with the content that arrives.</p>}
      <p className="demo-note">These are local geometry checks. They do not measure Core Web Vitals or certify accessibility.</p>
    </section>
    <footer><a href="https://github.com/appdever01/skelo#readme">Usage and API</a><span>MIT · React 18 and 19</span></footer>
  </main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><Playground /></StrictMode>);
