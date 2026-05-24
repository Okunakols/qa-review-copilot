'use client';

import { buildReportText, buildCSV, downloadBlob } from '../../lib/utils';

export function SettingsModal({ show, cfg, onClose, onSave }) {
  if (!show) return null;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><span className="modal-t">Settings</span><button className="modal-x" onClick={onClose}>&times;</button></div>
        <div className="modal-b">
          <div className="set-section">
            <div><label className="m-lbl">Reviewer Name</label><input className="m-inp" id="sp-author" type="text" placeholder="Full Name" defaultValue={cfg.author} /></div>
            <div><label className="m-lbl">Initials</label><input className="m-inp" id="sp-init" type="text" placeholder="JS" maxLength={4} style={{ width: 72 }} defaultValue={cfg.initials} /></div>
            <div><label className="m-lbl">Organization</label><input className="m-inp" id="sp-org" type="text" placeholder="MedTech Inc." defaultValue={cfg.org} /></div>
          </div>
          <div className="set-section">
            <div><label className="m-lbl">AI Engine API Key</label><input className="m-inp" id="sp-apikey" type="password" placeholder="Enter API key..." style={{ fontFamily: "'DM Mono', monospace" }} /></div>
          </div>
          <button className="m-btn" onClick={() => {
            onSave({
              author: document.getElementById('sp-author').value.trim(),
              initials: document.getElementById('sp-init').value.trim().toUpperCase(),
              org: document.getElementById('sp-org').value.trim(),
            });
          }}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}

export function ReportModal({ show, onClose, currentResult, findings, dispositions, cfg, docMeta, sel, mainFile, revId }) {
  if (!show || !currentResult) return null;
  const reportText = buildReportText(currentResult, findings, dispositions, cfg, { ...docMeta, revId }, sel, mainFile);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ width: 540 }} onClick={e => e.stopPropagation()}>
        <div className="modal-h"><span className="modal-t">Export QA Review Report</span><button className="modal-x" onClick={onClose}>&times;</button></div>
        <div className="modal-b">
          <div className="report-preview" style={{ whiteSpace: 'pre-wrap' }}>{reportText}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="m-btn" onClick={() => window.print()}>Print / PDF</button>
            <button className="m-btn" style={{ background: 'var(--emerald)' }} onClick={() => {
              const csv = buildCSV(findings, dispositions);
              downloadBlob(csv, 'review_findings_' + revId + '.csv', 'text/csv;charset=utf-8;');
            }}>Export CSV</button>
            <button className="m-btn" style={{ background: 'var(--ink3)' }} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HistoryModal({ show, history, onClose }) {
  if (!show) return null;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-h"><span className="modal-t">Review History</span><button className="modal-x" onClick={onClose}>&times;</button></div>
        <div className="modal-b" style={{ maxHeight: 360, overflowY: 'auto' }}>
          {!history.length ? (
            <div style={{ fontSize: 12, color: 'var(--mist2)', textAlign: 'center', padding: 20 }}>No review history yet.</div>
          ) : history.map((h, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--fog)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: 'var(--ink3)' }}>{h.id}</span>
                <span style={{ fontSize: 10, color: 'var(--mist2)' }}>{new Date(h.date).toLocaleDateString('en-GB')}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink2)' }}>{h.docName || '\u2014'} &middot; {h.findingCount} findings</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
