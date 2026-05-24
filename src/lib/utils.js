// Utility helpers: formatting, export, report builder

export function fmtBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

export function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-GB');
  } catch {
    return '';
  }
}

export function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escJs(s) {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

export function buildReportText(result, findings, dispositions, cfg, meta, sel, mainFile) {
  const date = new Date().toLocaleDateString('en-GB');
  const revId = meta.revId || '\u2014';
  const docName = meta.project || mainFile?.name || '\u2014';
  const rev = meta.revision || '\u2014';
  const company = meta.company || '\u2014';

  let lines = [
    'QA DOCUMENT REVIEW REPORT',
    '\u2550'.repeat(50),
    `Review ID     : ${revId}`,
    `Date          : ${date}`,
    `Reviewer      : ${cfg.author || '\u2014'} (${cfg.initials || '\u2014'})`,
    `Organization  : ${company}`,
    `Document      : ${docName}`,
    `Revision      : ${rev}`,
    `Source File   : ${mainFile?.name || '\u2014'}`,
    `Regulatory    : ${sel.reg} | Tone: ${sel.tone} | Lang: ${sel.lang}`,
    '\u2500'.repeat(50),
    `Overall Risk  : ${result.overallRisk}`,
    `Audit Status  : ${result.auditReadiness}`,
    '',
    'SUMMARY:',
    result.summary || '\u2014',
    '',
    'FINDINGS MATRIX:',
    `Critical: ${findings.filter(f => f.severity === 'Critical').length}  |  High: ${findings.filter(f => f.severity === 'High').length}  |  Medium: ${findings.filter(f => f.severity === 'Medium').length}  |  Low: ${findings.filter(f => f.severity === 'Low').length}  |  Observation: ${findings.filter(f => f.severity === 'OBSERVATION').length}  |  OFI: ${findings.filter(f => f.severity === 'OFI').length}`,
    '\u2550'.repeat(50),
    '',
  ];

  findings.forEach(f => {
    const disp = dispositions[f.id];
    lines.push(
      `${f.id} [${f.severity}] [${f.type}]${f.category ? ' (' + f.category + ')' : ''}${disp?.status ? ' [' + disp.status.toUpperCase() + ']' : ''}`
    );
    lines.push(`Location  : ${f.location || f.paragraphSnippet || '\u2014'}`);
    lines.push(`Issue     : ${f.issue}`);
    if (f.auditRisk) lines.push(`Audit Risk: ${f.auditRisk}`);
    if (f.regulatoryRef) lines.push(`Reg.Ref   : ${f.regulatoryRef}`);
    if (f.sourceRef) lines.push(`Source    : ${f.sourceRef}`);
    if (f.confidence != null) lines.push(`Confidence: ${f.confidence}%`);
    lines.push(`Comment   : ${f.comment}`);
    if (f.suggestedFix) lines.push(`Fix       : ${f.suggestedFix}`);
    if (disp?.note) lines.push(`Note      : ${disp.note}`);
    lines.push('\u2500'.repeat(40));
  });

  lines.push('');
  lines.push('END OF REPORT');
  return lines.join('\n');
}

export function buildCSV(findings, dispositions) {
  const rows = [
    [
      'ID',
      'Severity',
      'Type',
      'Category',
      'Location',
      'Issue',
      'Audit Risk',
      'Regulatory Ref',
      'Source Ref',
      'Confidence',
      'Comment',
      'Suggested Fix',
      'Disposition',
      'Note',
    ],
  ];
  findings.forEach(f => {
    const d = dispositions[f.id] || {};
    rows.push(
      [
        f.id,
        f.severity,
        f.type,
        f.category || '',
        f.location || '',
        f.issue,
        f.auditRisk || '',
        f.regulatoryRef || '',
        f.sourceRef || '',
        f.confidence != null ? f.confidence : '',
        f.comment,
        f.suggestedFix || '',
        d.status || '',
        d.note || '',
      ].map(v => '"' + (v || '').replace(/"/g, '""') + '"')
    );
  });
  return rows.map(r => r.join(',')).join('\n');
}

export function downloadBlob(content, filename, mimeType) {
  const blob =
    content instanceof Blob
      ? content
      : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}