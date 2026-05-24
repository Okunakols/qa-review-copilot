'use client';

import { fmtDate } from '../lib/utils';

export default function Sidebar({
  sources,
  onToggle,
  onDelete,
  onAdd,
  onFileSelect,
  srcModalFile,
  srcModalName,
  onSrcNameChange,
  onAddSource,
  srcError,
  showSrcModal,
  onCloseSrcModal,
}) {
  return (
    <>
      <div className="sidebar">
        <div className="sb-head">
          <span className="sb-title">Source Library</span>
          <button className="sb-add" onClick={onAdd}>
            + Add
          </button>
        </div>
        <div className="src-scroll">
          {!sources.length ? (
            <div className="src-empty">
              <span className="src-empty-icon" style={{ fontSize: 24 }}>
                &#128218;
              </span>
              No sources yet.
              <br />
              Add reference documents like URS, SOPs, CFRs, or ISO standards.
            </div>
          ) : (
            sources.map(s => (
              <div className="src-item" key={s.id}>
                <input
                  type="checkbox"
                  className="src-cb"
                  checked={s.active}
                  onChange={e => onToggle(s.id, e.target.checked)}
                />
                <div className="src-info">
                  <div className="src-name" title={s.name}>
                    {s.name}
                  </div>
                  <div className="src-meta">
                    {s.type} &middot; {(s.words || 0).toLocaleString()} words
                    &middot; {fmtDate(s.addedAt)}
                  </div>
                </div>
                <button
                  className="src-del"
                  onClick={() => onDelete(s.id)}
                  title="Remove"
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>
        <button className="add-src-btn" onClick={onAdd}>
          <span>+</span> Add Source Document
        </button>
        <div className="sb-hint">
          Checked sources are used in the review.
          <br />
          Add once, reuse every time.
        </div>
      </div>

      {showSrcModal && (
        <div className="modal-bg" onClick={onCloseSrcModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-h">
              <span className="modal-t">Add Source Document</span>
              <button className="modal-x" onClick={onCloseSrcModal}>
                &times;
              </button>
            </div>
            <div className="modal-b">
              <div>
                <label className="m-lbl">Source Name</label>
                <input
                  className="m-inp"
                  type="text"
                  placeholder="e.g. ISO 11607-1:2019 / Company SOP-001"
                  value={srcModalName}
                  onChange={e => onSrcNameChange(e.target.value)}
                />
              </div>
              <div className="m-dz" onClick={() => document.getElementById('inp-src').click()}>
                {!srcModalFile ? (
                  <div>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>&#128228;</div>
                    <div style={{ fontSize: 12, color: 'var(--mist)' }}>
                      Select file
                    </div>
                    <div
                      style={{ fontSize: 10, color: 'var(--mist2)', marginTop: 3 }}
                    >
                      .pdf &middot; .docx &middot; .txt
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 18, marginBottom: 5 }}>&#9989;</div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--emerald)',
                      }}
                    >
                      {srcModalFile.name}
                    </div>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="inp-src"
                accept=".pdf,.docx,.txt"
                style={{ display: 'none' }}
                onChange={onFileSelect}
              />
              <button
                className="m-btn"
                onClick={onAddSource}
                disabled={!srcModalFile}
              >
                Add to Library
              </button>
              {srcError && <div className="m-err">{srcError}</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
