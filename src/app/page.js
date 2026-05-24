'use client';

import { useState, useEffect, useCallback } from 'react';
import useReview from '../hooks/useReview';
import Chrome from '../components/Chrome';
import Sidebar from '../components/Sidebar';
import FindingsPanel from '../components/FindingsPanel';
import { SettingsModal, ReportModal, HistoryModal } from '../components/modals/Modals';
import { readFileText } from '../lib/fileReader';
import { fmtBytes } from '../lib/utils';
import { ANALYSIS_STEPS, RISK_MAP, READINESS_MAP } from '../lib/constants';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.defer = true;
    s.onload = resolve; s.onerror = reject;
    document.body.appendChild(s);
  });
}

export default function Home() {
  const r = useReview();
  const {
    mounted, apiKey, mainFile, findings, reviewedBlob, outName,
    currentResult, sources, cfg, history, sel, dispositions,
    activeStep, isReviewing, error, reviewComplete, revId, docMeta, filterMode,
    setMainFile, saveApiKey, clearApiKey, updateCfg, addSource,
    removeSource, toggleSource, setSel, setDisposition, saveNote,
    startReview, downloadDocx, resetReview, setFilterMode,
  } = r;

  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showSrcModal, setShowSrcModal] = useState(false);
  const [srcModalFile, setSrcModalFile] = useState(null);
  const [srcModalName, setSrcModalName] = useState('');
  const [srcError, setSrcError] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);

  // Load CDN libs after mount
  useEffect(() => {
    Promise.all([
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'),
    ]).then(() => {
      if (window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }).catch(() => {});
  }, []);

  useEffect(() => { setApiKeySaved(!!apiKey); }, [apiKey]);

  const handleApiKeySave = useCallback(() => {
    if (saveApiKey(apiKeyInput)) { setApiKeySaved(true); setApiKeyInput(''); }
  }, [saveApiKey, apiKeyInput]);

  const handleMainFile = useCallback(e => { const f = e.target?.files?.[0]; if (f) setMainFile(f); }, [setMainFile]);
  const handleDrop = useCallback(e => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer?.files?.[0]; if (f) setMainFile(f); }, [setMainFile]);
  const handleDragOver = useCallback(e => e.preventDefault(), []);

  const handleSrcFileSelect = useCallback(e => {
    const f = e.target?.files?.[0];
    if (f) { setSrcModalFile(f); setSrcModalName(prev => prev || f.name.replace(/\.[^.]+$/, '')); }
  }, []);

  const handleAddSource = useCallback(async () => {
    if (!srcModalFile) return;
    setSrcError('');
    try {
      const text = await readFileText(srcModalFile);
      if (!text.trim()) throw new Error('No text found in file.');
      addSource({ id: 's' + Date.now() + Math.random().toString(36).slice(2, 5), name: srcModalName || srcModalFile.name, fileName: srcModalFile.name, type: srcModalFile.name.split('.').pop().toUpperCase(), addedAt: new Date().toISOString(), active: true, words: text.split(/\s+/).filter(Boolean).length, text });
      setShowSrcModal(false); setSrcModalFile(null); setSrcModalName('');
    } catch (err) { setSrcError(err.message); }
  }, [srcModalFile, srcModalName, addSource]);

  const riskBadge = currentResult ? RISK_MAP[currentResult.overallRisk] || ['rb-M', '\u2014'] : null;
  const readinessStr = currentResult ? READINESS_MAP[currentResult.auditReadiness] || 'rbadge-nw \u2014' : null;
  const stats = { total: findings.length, critical: findings.filter(f => f.severity === 'Critical').length, high: findings.filter(f => f.severity === 'High').length, medium: findings.filter(f => f.severity === 'Medium').length, low: findings.filter(f => f.severity === 'Low').length, observation: findings.filter(f => f.severity === 'OBSERVATION').length, ofi: findings.filter(f => f.severity === 'OFI').length };

  // Render loading until client-side mounted
  if (!mounted) {
    return <div style={{ padding: 40, fontFamily: "'DM Sans', system-ui, sans-serif", color: '#0a0e1a' }}><h1>DocuReview AI</h1><p>Loading...</p></div>;
  }

  return (
    <>
      <Chrome revId={revId} cfg={cfg} onSettings={() => setShowSettings(true)} onHistory={() => setShowHistory(true)} />
      <div className="workspace">
        <Sidebar
          sources={sources} onToggle={toggleSource} onDelete={removeSource}
          onAdd={() => setShowSrcModal(true)} showSrcModal={showSrcModal}
          onCloseSrcModal={() => { setShowSrcModal(false); setSrcModalFile(null); setSrcModalName(''); setSrcError(''); }}
          onFileSelect={handleSrcFileSelect} srcModalFile={srcModalFile}
          srcModalName={srcModalName} onSrcNameChange={setSrcModalName}
          onAddSource={handleAddSource} srcError={srcError}
        />
        <div className="main">
          {/* Metadata bar */}
          <div className="meta-bar">
            <div className="meta-field"><span className="meta-lbl">Project / Document</span><input className="meta-inp" placeholder="e.g. SBSVP-2025-001 SBS Validation Plan" value={docMeta.project} onChange={e => r.setDocMeta(prev => ({ ...prev, project: e.target.value }))} /></div>
            <div className="meta-divider" />
            <div className="meta-field" style={{ maxWidth: 100 }}><span className="meta-lbl">Revision</span><input className="meta-inp" placeholder="Rev 00" value={docMeta.revision} onChange={e => r.setDocMeta(prev => ({ ...prev, revision: e.target.value }))} /></div>
            <div className="meta-divider" />
            <div className="meta-field" style={{ maxWidth: 120 }}><span className="meta-lbl">Company</span><input className="meta-inp" placeholder="MedTech Inc." value={docMeta.company} onChange={e => r.setDocMeta(prev => ({ ...prev, company: e.target.value }))} /></div>
            <div className="meta-divider" />
            <div className="meta-field" style={{ maxWidth: 110 }}><span className="meta-lbl">Date</span><input className="meta-inp" type="date" value={docMeta.date} onChange={e => r.setDocMeta(prev => ({ ...prev, date: e.target.value }))} /></div>
          </div>

          {/* API Key */}
          {!apiKeySaved ? (
            <div className="ak-strip">
              <div className="ak-ico">&#128273;</div>
              <div className="ak-body">
                <div className="ak-title">AI Engine API Key</div>
                <div className="ak-sub">Enter your API key. Stored in session memory only.</div>
                <div className="ak-row">
                  <input className="ak-inp" type="password" placeholder="Enter API key..." value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleApiKeySave()} />
                  <button className="ak-save" onClick={handleApiKeySave}>Authenticate</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="ak-strip ok">
              <div className="ak-ico" style={{ background: 'rgba(34,197,94,.15)' }}>&#9989;</div>
              <div className="ak-body">
                <div className="ak-ok-row"><div className="ak-ok-dot" /><span className="ak-ok-txt">API key authenticated</span><span className="ak-chg" onClick={() => { clearApiKey(); setApiKeySaved(false); }}>Change</span></div>
                <div className="ak-sub" style={{ marginTop: 3 }}>Ready to analyze documents</div>
              </div>
            </div>
          )}

          {error && <div className="err-card"><span>&#9888;</span><span>{error}</span></div>}
          }

          {/* Drop zone */}
          <div className="dropcard">
            <div className="dropcard-h">
              <div className={`dch-dot ${mainFile ? 'active' : ''}`} />
              <span className="dch-title">Primary Document</span>
              <span className="dch-sub">.docx / .pdf / .txt / max 10MB</span>
            </div>
            <div className={`dz ${mainFile ? 'has' : ''}`} onClick={() => document.getElementById('inp-main')?.click()} onDragOver={handleDragOver} onDragLeave={() => {}} onDrop={handleDrop}>
              {!mainFile ? (
                <div><span className="dz-icon">&#128228;</span><div className="dz-title">Drop document here or click to browse</div><div className="dz-sub">Supports Word, PDF (text-based), and plain text</div></div>
              ) : (
                <div><span className="dz-icon">&#128196;</span><div className="dz-name">{mainFile.name}</div><div className="dz-sub">{fmtBytes(mainFile.size)}</div><button className="dz-rm" onClick={e => { e.stopPropagation(); setMainFile(null); }}>Remove</button></div>
              )}
            </div>
            <input type="file" id="inp-main" accept=".docx,.pdf,.txt" style={{ display: 'none' }} onChange={handleMainFile} />
          </div>

          {/* Config */}
          <div className="config-card">
            <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--fog)' }}><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)' }}>Review Configuration</span></div>
            <div className="config-grid">
              <div className="config-col"><span className="cfg-lbl">Language</span><div className="segs">{[{ v: 'Turkish', l: 'Turkish' }, { v: 'English', l: 'English' }].map(o => (<button key={o.v} className={`seg ${sel.lang === o.v ? 'on' : ''}`} onClick={() => setSel(prev => ({ ...prev, lang: o.v }))}><span className="seg-dot" />{o.l}</button>))}</div></div>
              <div className="config-col"><span className="cfg-lbl">Comment Tone</span><div className="segs">{[{ v: 'Formal', l: 'Formal / Audit' }, { v: 'Simple', l: 'Simple' }, { v: 'Friendly', l: 'Friendly' }].map(o => (<button key={o.v} className={`seg ${sel.tone === o.v ? 'on' : ''}`} onClick={() => setSel(prev => ({ ...prev, tone: o.v }))}><span className="seg-dot" />{o.l}</button>))}</div></div>
              <div className="config-col"><span className="cfg-lbl">Regulatory</span><div className="segs">{[{ v: 'ISO13485', l: 'ISO 13485' }, { v: 'EUMDR', l: 'EU MDR' }, { v: 'FDA', l: 'FDA 21 CFR' }, { v: 'ALL', l: 'All Pathways' }].map(o => (<button key={o.v} className={`seg ${sel.reg === o.v ? 'on' : ''}`} onClick={() => setSel(prev => ({ ...prev, reg: o.v }))}><span className="seg-dot" />{o.l}</button>))}</div></div>
              <div className="config-col"><span className="cfg-lbl">Intensity</span><div className="segs">{[{ v: 'Light', l: 'Light' }, { v: 'Standard', l: 'Standard' }, { v: 'Strict', l: 'Strict / Audit' }].map(o => (<button key={o.v} className={`seg ${sel.int === o.v ? 'on' : ''}`} onClick={() => setSel(prev => ({ ...prev, int: o.v }))}><span className="seg-dot" />{o.l}</button>))}</div></div>
            </div>
          </div>

          {/* Status */}
          {isReviewing && (
            <div className="status-card">
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 10 }}>Analysis in progress...</div>
              <div className="status-steps">
                {ANALYSIS_STEPS.map((s, i) => {
                  const ai = ANALYSIS_STEPS.findIndex(x => x.id === activeStep);
                  const si = ANALYSIS_STEPS.findIndex(x => x.id === s.id);
                  let cls = '', icon = String(i + 1);
                  if (ai >= 0 && si < ai) { cls = 'done'; icon = '\u2713'; }
                  else if (si === ai) { cls = 'active'; icon = '\u25CF'; }
                  return <div key={s.id} className={`step-row ${cls}`}><div className={`step-icon ${cls}`}>{icon}</div><span className="step-line">{s.label}</span></div>;
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="cta-zone">
            <button className="btn-review" disabled={!mainFile || !apiKey || isReviewing} onClick={startReview}>Start AI Review</button>
            <div className="privacy">Documents are not stored on any server. Content is processed by AI engine for analysis only. Output: <strong>FileName_reviewed.docx</strong></div>
          </div>

          {/* Results */}
          {reviewComplete && currentResult && (
            <div className="res-section">
              <div className="summary-strip">
                <div className="ss-top">
                  <div><div className="ss-title">Review Complete</div><div className="ss-id">{revId} &middot; {new Date().toLocaleString('en-GB')} &middot; {mainFile?.name}</div></div>
                  <div className="ss-badges">
                    {riskBadge && <span className={`risk-badge ${riskBadge[0]}`}>{riskBadge[1]}</span>}
                    }
                    {readinessStr && (() => { const p = readinessStr.split(' '); return <span className={`ready-badge ${p[0]}`}>{p.slice(1).join(' ')}</span>; })()}
                    }
                    )
                    }
                  </div>
                </div>
                <div className="ss-text">{currentResult.summary || ''}</div>
              </div>
              <div className="stats-row">
                <div className="stat"><div className="stat-v sv0">{stats.total}</div><div className="stat-l">Total</div></div>
                <div className="stat"><div className="stat-v sv1">{stats.critical}</div><div className="stat-l">Critical</div></div>
                <div className="stat"><div className="stat-v sv2h">{stats.high}</div><div className="stat-l">High</div></div>
                <div className="stat"><div className="stat-v sv2">{stats.medium}</div><div className="stat-l">Medium</div></div>
                <div className="stat"><div className="stat-v sv3">{stats.low}</div><div className="stat-l">Low</div></div>
                <div className="stat"><div className="stat-v sv4">{stats.observation}</div><div className="stat-l">Obs.</div></div>
                <div className="stat"><div className="stat-v sv5">{stats.ofi}</div><div className="stat-l">OFI</div></div>
              </div>
              {reviewedBlob && (
                <div className="dl-banner">
                  <div className="dl-ico">&#128196;</div>
                  <div className="dl-info"><div className="dl-title">{outName} ready &mdash; {findings.length} comments injected</div><div className="dl-sub">All findings injected as Word Comments.</div></div>
                  <button className="btn-dl" onClick={downloadDocx}>Download .docx</button>
                  <button className="btn-report" onClick={() => setShowReport(true)}>Export Report</button>
                </div>
              )}
            </div>
          )}
        </div>

        <FindingsPanel findings={findings} dispositions={dispositions} filterMode={filterMode} onSetDisp={setDisposition} onSaveNote={saveNote} onSetFilter={setFilterMode} onReset={resetReview} />
      </div>

      <SettingsModal show={showSettings} cfg={cfg} onClose={() => setShowSettings(false)} onSave={newCfg => { updateCfg(newCfg); setShowSettings(false); }} />
      <ReportModal show={showReport} onClose={() => setShowReport(false)} currentResult={currentResult} findings={findings} dispositions={dispositions} cfg={cfg} docMeta={docMeta} sel={sel} mainFile={mainFile} revId={revId} />
      <HistoryModal show={showHistory} history={history} onClose={() => setShowHistory(false)} />
    </>
  );
}
