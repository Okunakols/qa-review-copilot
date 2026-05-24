'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { callAI } from '../lib/api';
import { injectComments } from '../lib/docx';
import { readFileText } from '../lib/fileReader';
import { LS_KEYS, SS_KEYS, ANALYSIS_STEPS } from '../lib/constants';
import { buildReportText, buildCSV, downloadBlob } from '../lib/utils';

export default function useReview() {
  const [mounted, setMounted] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [mainFile, setMainFile] = useState(null);
  const [mainDocxBuf, setMainDocxBuf] = useState(null);
  const [findings, setFindings] = useState([]);
  const [reviewedBlob, setReviewedBlob] = useState(null);
  const [outName, setOutName] = useState('reviewed.docx');
  const [currentResult, setCurrentResult] = useState(null);
  const [sources, setSources] = useState([]);
  const [cfg, setCfg] = useState({ author: '', initials: '', org: '' });
  const [history, setHistory] = useState([]);
  const [sel, setSel] = useState({ lang: 'Turkish', tone: 'Formal', reg: 'ISO13485', int: 'Standard' });
  const [dispositions, setDispositions] = useState({});
  const [activeStep, setActiveStep] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState('');
  const [reviewComplete, setReviewComplete] = useState(false);
  const [revId, setRevId] = useState('');
  const [docMeta, setDocMeta] = useState({ project: '', revision: '', company: '', date: '' });
  const [filterMode, setFilterMode] = useState('all');

  const reviewIdRef = useRef('');

  // Hydrate from localStorage after mount only
  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(LS_KEYS.SOURCES) || '[]'); if (s.length) setSources(s); } catch {}
    try { setCfg(JSON.parse(localStorage.getItem(LS_KEYS.CONFIG) || '{"author":"","initials":"","org":""}')); } catch {}
    try { const h = JSON.parse(localStorage.getItem(LS_KEYS.HISTORY) || '[]'); if (h.length) setHistory(h); } catch {}
    try { const k = sessionStorage.getItem(SS_KEYS.API_KEY); if (k && k.length >= 20) setApiKey(k); } catch {}
    setDocMeta(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
    // Generate initial review ID
    const id = 'RVW-' + Date.now().toString(36).toUpperCase();
    setRevId(id);
    reviewIdRef.current = id;
    setMounted(true);
  }, []);

  const generateReviewId = useCallback(() => {
    const id = 'RVW-' + Date.now().toString(36).toUpperCase();
    setRevId(id);
    reviewIdRef.current = id;
    return id;
  }, []);

  const saveApiKey = useCallback(key => {
    if (!key || key.length < 20) { setError('Invalid API key'); return false; }
    setApiKey(key);
    try { sessionStorage.setItem(SS_KEYS.API_KEY, key); } catch {}
    setError('');
    return true;
  }, []);

  const clearApiKey = useCallback(() => {
    setApiKey('');
    try { sessionStorage.removeItem(SS_KEYS.API_KEY); } catch {}
  }, []);

  const updateCfg = useCallback(newCfg => {
    setCfg(prev => { const u = { ...prev, ...newCfg }; try { localStorage.setItem(LS_KEYS.CONFIG, JSON.stringify(u)); } catch {}; return u; });
  }, []);

  const addSource = useCallback(source => {
    setSources(prev => { const n = [...prev, source]; try { localStorage.setItem(LS_KEYS.SOURCES, JSON.stringify(n)); } catch {}; return n; });
  }, []);

  const removeSource = useCallback(id => {
    setSources(prev => { const n = prev.filter(s => s.id !== id); try { localStorage.setItem(LS_KEYS.SOURCES, JSON.stringify(n)); } catch {}; return n; });
  }, []);

  const toggleSource = useCallback((id, active) => {
    setSources(prev => { const n = prev.map(s => s.id === id ? { ...s, active } : s); try { localStorage.setItem(LS_KEYS.SOURCES, JSON.stringify(n)); } catch {}; return n; });
  }, []);

  const setDisposition = useCallback((fid, status) => {
    setDispositions(prev => { const ex = prev[fid] || {}; return { ...prev, [fid]: { ...ex, status: ex.status === status ? null : status } }; });
  }, []);

  const saveNote = useCallback((fid, note) => {
    setDispositions(prev => { const ex = prev[fid] || {}; return { ...prev, [fid]: { ...ex, note } }; });
  }, []);

  const startReview = useCallback(async () => {
    if (!mainFile || !apiKey) return;
    setError(''); setReviewComplete(false); setIsReviewing(true);
    setFindings([]); setReviewedBlob(null);
    const currentRevId = generateReviewId();
    try {
      setActiveStep('parse');
      const mainText = await readFileText(mainFile);
      if (!mainText.trim()) throw new Error('No readable text found in document.');
      let docxBuf = null;
      if (mainFile.name.toLowerCase().endsWith('.docx')) { docxBuf = await mainFile.arrayBuffer(); setMainDocxBuf(docxBuf); }
      setActiveStep('load');
      const activeSrcs = sources.filter(s => s.active && s.text);
      setActiveStep('send');
      const apiMeta = { project: docMeta.project, revision: docMeta.revision, company: docMeta.company };
      const result = await callAI(mainText, mainFile.name, activeSrcs, sel.reg, sel.int, sel.lang, sel.tone, cfg.author || 'QA Reviewer', apiMeta, apiKey);
      const findingsList = result.findings || [];
      setFindings(findingsList);
      setCurrentResult(result);
      setActiveStep('inject');
      let blob = null;
      if (docxBuf && window.JSZip) { try { blob = await injectComments(docxBuf, findingsList, cfg.author || 'QA Reviewer', cfg.initials || 'QR'); } catch (e) { console.warn('Comment injection:', e); } }
      setReviewedBlob(blob);
      setOutName(mainFile.name.replace(/\.docx$/i, '') + '_reviewed.docx');
      setActiveStep('finalize');
      await new Promise(r => setTimeout(r, 400));
      setReviewComplete(true); setIsReviewing(false); setActiveStep(null);
      const entry = { id: currentRevId, date: new Date().toISOString(), docName: mainFile?.name, docProject: docMeta.project, findingCount: findingsList.length, risk: result.overallRisk, readiness: result.auditReadiness };
      setHistory(prev => { const n = [entry, ...prev].slice(0, 20); try { localStorage.setItem(LS_KEYS.HISTORY, JSON.stringify(n)); } catch {}; return n; });
    } catch (err) {
      setIsReviewing(false); setActiveStep(null);
      setError(err.message || 'Analysis failed. Please try again.');
    }
  }, [mainFile, apiKey, sources, sel, cfg, docMeta, generateReviewId]);

  const downloadDocx = useCallback(() => { if (!reviewedBlob) return; downloadBlob(reviewedBlob, outName); }, [reviewedBlob, outName]);
  const exportReport = useCallback(() => {
    if (!currentResult) return;
    const text = buildReportText(currentResult, findings, dispositions, cfg, { ...docMeta, revId }, sel, mainFile);
    downloadBlob(text, 'qa_review_report_' + revId + '.txt', 'text/plain');
  }, [currentResult, findings, dispositions, cfg, docMeta, revId, sel, mainFile]);
  const exportCSV = useCallback(() => {
    const csv = buildCSV(findings, dispositions);
    downloadBlob(csv, 'review_findings_' + revId + '.csv', 'text/csv;charset=utf-8;');
  }, [findings, dispositions, revId]);
  const resetReview = useCallback(() => {
    setFindings([]); setReviewedBlob(null); setCurrentResult(null);
    setMainFile(null); setMainDocxBuf(null); setReviewComplete(false);
    setDispositions({}); setFilterMode('all'); setError('');
    generateReviewId();
  }, [generateReviewId]);

  return {
    mounted, apiKey, mainFile, findings, reviewedBlob, outName, currentResult,
    sources, cfg, history, sel, dispositions, activeStep, isReviewing,
    error, reviewComplete, revId, docMeta, filterMode,
    setMainFile, saveApiKey, clearApiKey, updateCfg, addSource,
    removeSource, toggleSource, setSel, setDisposition, saveNote,
    startReview, downloadDocx, exportReport, exportCSV, resetReview,
    setDocMeta, setFilterMode, setError, generateReviewId,
  };
}
