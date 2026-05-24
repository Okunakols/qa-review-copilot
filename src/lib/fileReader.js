// File reader — mammoth / pdf.js / txt

export async function readFileText(f) {
  const ext = f.name.split('.').pop().toLowerCase();

  if (ext === 'txt') return f.text();

  if (ext === 'docx') {
    const ab = await f.arrayBuffer();
    const r = await mammoth.extractRawText({ arrayBuffer: ab });
    return r.value || '';
  }

  if (ext === 'pdf') {
    if (typeof pdfjsLib === 'undefined')
      throw new Error('PDF library unavailable.');
    const ab = await f.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    let t = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const pg = await pdf.getPage(i);
      const ct = await pg.getTextContent();
      t += ct.items.map(x => x.str).join(' ') + '\n';
    }
    if (!t.trim())
      throw new Error(
        'No text in PDF. If scanned, OCR is required first.'
      );
    return t;
  }

  throw new Error('Unsupported format: .' + ext);
}
