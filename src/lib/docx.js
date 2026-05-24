// DOCX comment + track change injection using JSZip (loaded dynamically)

export async function injectComments(arrayBuffer, findings, author, initials) {
  if (!window.JSZip) throw new Error('JSZip library not loaded.');
  const zip = await window.JSZip.loadAsync(arrayBuffer);
  let docXml = await zip.file('word/document.xml').async('string');
  let commXml = '';
  const cf = zip.file('word/comments.xml');
  if (cf) commXml = await cf.async('string');
  else
    commXml =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"></w:comments>';

  let relsXml = '';
  const rf = zip.file('word/_rels/document.xml.rels');
  if (rf) relsXml = await rf.async('string');
  let ctXml = await zip.file('[Content_Types].xml').async('string');

  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const allIds = [
    ...docXml.matchAll(/w:id="(\d+)"/g),
    ...commXml.matchAll(/w:id="(\d+)"/g),
  ];
  let cid = allIds.length
    ? Math.max(...allIds.map(m => parseInt(m[1])))
    : 0;

  const paraRx = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  const paras = [];
  let pm;
  while ((pm = paraRx.exec(docXml)) !== null)
    paras.push({ start: pm.index, end: pm.index + pm[0].length, xml: pm[0] });

  function pText(xml) {
    return xml
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function xe(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function findPara(idx, snippet) {
    const snip = (snippet || '').trim().toLowerCase().slice(0, 20);
    if (idx >= 0 && idx < paras.length) {
      const pt = pText(paras[idx].xml).toLowerCase();
      if (!snip || pt.includes(snip.slice(0, 12))) return paras[idx];
    }
    if (snip.length >= 5) {
      for (const p of paras) {
        if (pText(p.xml).toLowerCase().includes(snip.slice(0, 12)))
          return p;
      }
    }
    if (idx >= 0 && idx < paras.length) return paras[idx];
    return paras[Math.min(Math.max(0, idx), paras.length - 1)] || null;
  }

  const paraComments = new Map();
  for (const f of findings) {
    if (!f.comment) continue;
    const target = findPara(f.paragraphIndex || 0, f.paragraphSnippet);
    if (!target) continue;
    if (!paraComments.has(target.start))
      paraComments.set(target.start, { target, findings: [] });
    paraComments.get(target.start).findings.push(f);
  }

  const mods = [];
  const newComments = [];

  for (const [, { target, findings: fList }] of paraComments) {
    const commentText = fList
      .map(f => {
        const prefix = fList.length > 1 ? '[' + f.id + '] ' : '';
        const regNote = f.regulatoryRef ? '\nRef: ' + f.regulatoryRef : '';
        const sevNote = f.severity ? ' [' + f.severity + ']' : '';
        return prefix + f.severity + ': ' + f.comment + regNote;
      })
      .join('\n\n');

    cid++;
    const cId = cid;
    const cLines = xe(commentText).split('\n');
    const cParas = cLines
      .map(
        (line, i) =>
          '<w:p><w:pPr><w:pStyle w:val="CommentText"/></w:pPr>' +
          (i === 0
            ? '<w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:t>' +
              cId +
              '</w:t></w:r>'
            : '') +
          '<w:r><w:t xml:space="preserve">' +
          line +
          '</w:t></w:r></w:p>'
      )
      .join('');

    newComments.push(
      '<w:comment w:id="' +
        cId +
        '" w:author="' +
        xe(author) +
        '" w:date="' +
        now +
        '" w:initials="' +
        xe(initials) +
        '">' +
        cParas +
        '</w:comment>'
    );

    const tc =
      (
        fList.find(
          f =>
            f.trackChange &&
            f.trackChange.type &&
            f.trackChange.type !== 'none' &&
            f.trackChange.originalText
        ) || {}
      ).trackChange || null;

    let paraXml = target.xml;

    if (tc && tc.originalText && tc.suggestedText) {
      cid++;
      const rId = cid;
      const delXml =
        '<w:del w:id="' +
        rId +
        '" w:author="' +
        xe(author) +
        '" w:date="' +
        now +
        '"><w:r><w:delText xml:space="preserve">' +
        xe(tc.originalText) +
        '</w:delText></w:r></w:del>';
      const insXml =
        '<w:ins w:id="' +
        (rId + 1) +
        '" w:author="' +
        xe(author) +
        '" w:date="' +
        now +
        '"><w:r><w:t xml:space="preserve">' +
        xe(tc.suggestedText) +
        '</w:t></w:r></w:ins>';
      const rx = new RegExp(
        xe(tc.originalText).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      if (rx.test(paraXml)) paraXml = paraXml.replace(rx, delXml + insXml);
    }

    const anchor =
      '<w:commentRangeStart w:id="' +
      cId +
      '"/><w:commentRangeEnd w:id="' +
      cId +
      '"/><w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="' +
      cId +
      '"/></w:r>';
    paraXml = paraXml.replace('</w:p>', anchor + '</w:p>');

    mods.push({ start: target.start, end: target.end, newXml: paraXml });
  }

  mods.sort((a, b) => b.start - a.start);
  for (const m of mods)
    docXml = docXml.slice(0, m.start) + m.newXml + docXml.slice(m.end);

  if (newComments.length)
    commXml = commXml.replace(
      '</w:comments>',
      newComments.join('\n') + '</w:comments>'
    );

  if (relsXml && !relsXml.includes('comments.xml')) {
    relsXml = relsXml.replace(
      '</Relationships>',
      '<Relationship Id="rIdQAComm" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="comments.xml"/></Relationships>'
    );
    zip.file('word/_rels/document.xml.rels', relsXml);
  }

  if (!ctXml.includes('comments+xml')) {
    ctXml = ctXml.replace(
      '</Types>',
      '<Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/></Types>'
    );
    zip.file('[Content_Types].xml', ctXml);
  }

  zip.file('word/document.xml', docXml);
  zip.file('word/comments.xml', commXml);

  return zip.generateAsync({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });
}
