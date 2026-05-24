'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { callAI } from '../lib/api';
import { injectComments } from '../lib/docx';
import { readFileText } from '../lib/fileReader';
import {
  LS_KEYS,
  SS_KEYS,
  ANALYSIS_STEPS,
} from '../lib/constants';
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
  const [sel, setSel] = useState({
    lang: 'Turkish',
    tone: 'Formal',
    reg: 'ISO13485',
    int: 'Standard',
  });
  const [dispositions, setDispositions] = useState({});
  const [activeStep, setActiveStep] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState('');
  const [reviewComplete, setReviewComplete] = useState(false);
  const [revId, setRevId] = useState('');
  const [docMeta, setDocMeta] = useState({
    project: '',
    revision: '',
    company: '',
    date: '',
  });
  const [filterMode, setFilterMode] = useState('all');

  const reviewIdRef = useRef('');

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    try {
      const storedSources = JSON.parse(localStorage.getItem(LS_KEYS.SOURCES) || '[]');
      if (storedSources.length) setSources(storedSources);
    } catch {}
    try {
      const storedCfg = JSON.parse(
        localStorage.getItem(LS_KEYS.CONFIG) || '{"author":"","initials":"","org":""}'
      );
      setCfg(storedCfg);
    } catch {}
    try {
      const storedHistory = JSON.parse(localStorage.getItem(LS_KEYS.HISTORY) || '[]');
      if (storedHistory.length) setHistory(storedHistory);
    } catch {}
    const k = sessionStorage.getItem(SS_KEYS.API_KEY);
    if (k && k.length >= 20) setApiKey(k);
    setDocMeta(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
    setMounted(true);
  }, []);

  const generateReviewId = useCallback(() => {
    const id = 'RVW-' + Date.now().toString(36).toUpperCase();
    setRevId(id);
    reviewIdRef.current = id;
    return id;
  }, []);

  // Generate initial review ID after mount
  useEffect(() => {
    if (mounted) generateReviewId();
  }, [mounted, generateReviewId]);

  const saveApiKey = useCallback(
    key => {
      if (!key || key.length < 20) {
        setError('Invalid API key — please check and try again.');
        return false;
      }
      setApiKey(key);
      try { sessionStorage.setItem(SS_KEYS.API_KEY, key); } catch {}
      setError('');
      return true;
    },
    []
  );

  const clearApiKey = useCallback(() => {
    setApiKey('');
    try { sessionStorage.removeItem(SS_KEYS.API_KEY); } catch {}
  }, []);

  const updateCfg = useCallback(newCfg => {
    setCfg(prev => {
      const updated = { ...prev, ...newCfg };
      try { localStorage.setItem(LS_KEYS.CONFIG, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const addSource = useCallback(source => {
    setSources(prev => {
      const next = [...prev, source];
      try { localStorage.setItem(LS_KEYS.SOURCES, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeSource = useCallback(id => {
    setSources(prev => {
      const next = prev.filter(s => s.id !== id);
      try { localStorage.setItem(LS_KEYS.SOURCES, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const toggleSource = useCallback((id, active) => {
    setSources(prev => {
      const next = prev.map(s => (s.id === id ? { ...s, active } : s));
      try { localStorage.setItem(LS_KEYS.SOURCES, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const setDisposition = useCallback((fid, status) => {
    setDispositions(prev => {
      const existing = prev[fid] || {};
      return {
        ...prev,
        [fid]: { ...existing, status: existing.status === status ? null : status },
      };
    });
  }, []);

  const saveNote = useCallback((fid, note) => {
    setDispositions(prev => {
      const existing = prev[fid] || {};
      return { ...prev, [fid]: { ...existing, note } };
    });
  }, []);

  const startReview = useCallback(async () => {
    if (!mainFile || !apiKey) return;

    setError('');
    setReviewComplete(false);
    setIsReviewing(true);
    setFindings([]);
    setReviewedBlob(null);
    const currentRevId = generateReviewId();

    try {
      setActiveStep('parse');
      const mainText = await readFileText(mainFile);
      if (!mainText.trim()) throw new Error('No readable text found in document.');

      let docxBuf = null;
      if (mainFile.name.toLowerCase().endsWith('.docx')) {
        docxBuf = await mainFile.arrayBuffer();
        setMainDocxBuf(docxBuf);
      }

      setActiveStep('load');
      const activeSrcs = sources.filter(s => s.active && s.text);

      setActiveStep('send');
      const apiMeta = { project: docMeta.project, revision: docMeta.revision, company: docMeta.company };
      const result = await callAI(
        mainText,
        mainFile.name,
        activeSrcs,
        sel.reg,
        sel.int,
        sel.lang,
        sel.tone,
        cfg.author || 'QA Reviewer',
        apiMeta,
        apiKey
      );

      const findingsList = result.findings || [];
      setFindings(findingsList);
      setCurrentResult(result);

      setActiveStep('inject');
      let blob = null;
      if (docxBuf && typeof window !== 'undefined' && window.JSZip) {
        try {
          blob = await injectComments(
            docxBuf,
            findingsList,
            cfg.author || 'QA Reviewer',
            cfg.initials || 'QR'
          );
        } catch (e) {
          console.warn('Comment injection:', e);
        }
      }
      setReviewedBlob(blob);
      setOutName(
        mainFile.name.replace(/\.docx$/i, '') + '_reviewed.docx'
      );

      setActiveStep('finalize');
      await new Promise(r => setTimeout(r, 400));

      setReviewComplete(true);
      setIsReviewing(false);
      setActiveStep(null);

      // Save to history
      const entry = {
        id: currentRevId,
        date: new Date().toISOString(),
        docName: mainFile?.name,
        docProject: docMeta.project,
        findingCount: findingsList.length,
        risk: result.overallRisk,
        readiness: result.auditReadiness,
      };
      setHistory(prev => {
        const next = [entry, ...prev].slice(0, 20);
        try { localStorage.setItem(LS_KEYS.HISTORY, JSON.stringify(next)); } catch {}
        return next;
      });
    } catch (err) {
      setIsReviewing(false);
      setActiveStep(null);
      setError(err.message || 'Analysis failed. Please try again.');
    }
  }, [mainFile, apiKey, sources, sel, cfg, docMeta, generateReviewId]);

  const downloadDocx = useCallback(() => {
    if (!reviewedBlob) return;
    downloadBlob(reviewedBlob, outName);
  }, [reviewedBlob, outName]);

  const exportReport = useCallback(() => {
    if (!currentResult) return;
    const text = buildReportText(
      currentResult,
      findings,
      dispositions,
      cfg,
      { ...docMeta, revId },
      sel,
      mainFile
    );
    downloadBlob(text, 'qa_review_report_' + revId + '.txt', 'text/plain');
  }, [currentResult, findings, dispositions, cfg, docMeta, revId, sel, mainFile]);

  const exportCSV = useCallback(() => {
    const csv = buildCSV(findings, dispositions);
    downloadBlob(
      csv,
      'review_findings_' + revId + '.csv',
      'text/csv;charset=utf-8;'
    );
  }, [findings, dispositions, revId]);

  const resetReview = useCallback(() => {
    setFindings([]);
    setReviewedBlob(null);
    setCurrentResult(null);
    setMainFile(null);
    setMainDocxBuf(null);
    setReviewComplete(false);
    setDispositions({});
    setFilterMode('all');
    setError('');
    generateReviewId();
  }, [generateReviewId]);

  return {
    // State
    mounted,
    apiKey,
    mainFile,
    mainDocxBuf,
    findings,
    reviewedBlob,
    outName,
    currentResult,
    sources,
    cfg,
    history,
    sel,
    dispositions,
    activeStep,
    isReviewing,
    error,
    reviewComplete,
    revId,
    docMeta,
    filterMode,
    // Actions
    setMainFile,
    saveApiKey,
    clearApiKey,
    updateCfg,
    addSource,
    removeSource,
    toggleSource,
    setSel,
    setDisposition,
    saveNote,
    startReview,
    downloadDocx,
    exportReport,
    exportCSV,
    resetReview,
    setDocMeta,
    setFilterMode,
    setError,
    generateReviewId,
  };
}
