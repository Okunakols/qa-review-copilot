'use client';

import { escHtml, escJs } from '../lib/utils';
import {
  SEVERITY_ICONS,
  SEVERITY_BADGE_CLASSES,
  SEVERITY_CARD_CLASSES,
  FINDING_TYPE_LABELS,
} from '../lib/constants';

function FindingCard({ f, index, disposition, onSetDisp, onSaveNote }) {
  const sevIcon = SEVERITY_ICONS[f.severity] || '\u2022';
  const sevBadge = SEVERITY_BADGE_CLASSES[f.severity] || 'sbI';
  const sevCard = SEVERITY_CARD_CLASSES[f.severity] || 'sI';
  const typeLabel = FINDING_TYPE_LABELS[f.type] || f.type || '';

  const hasSourceEvidence =
    f.sourceEvidence &&
    !f.sourceEvidence.includes('not found') &&
    !f.sourceEvidence.includes('bulunamad');

  return (
    <div className={`fc ${sevCard}`}>
      <div
        className="fc-hdr"
        onClick={() => {
          const b = document.getElementById('fcb-' + index);
          const a = document.getElementById('arr-' + index);
          if (b) {
            const o = b.classList.toggle('open');
            if (a) a.classList.toggle('open', o);
          }
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="fc-badges">
            <span className={`sb ${sevBadge}`}>
              {sevIcon} {f.severity}
            </span>
            <span className="sb sb-type">{typeLabel}</span>
            {f.category && (
              <span className="sb sb-cat">{f.category}</span>
            )}
          </div>
          <div className="fc-title">{f.issue || 'Finding'}</div>
          {f.regulatoryRef && (
            <div style={{ marginTop: 4 }}>
              <span className="reg-pill">{f.regulatoryRef}</span>
            </div>
          )}
        </div>
        <div
          className="fc-chevron"
          id={'arr-' + index}
        >
          &#9662;
        </div>
      </div>
      <div className="fc-body" id={'fcb-' + index} style={{ display: 'none' }}>
        {/* Location */}
        {f.location && (
          <div className="fp">
            <div className="fp-hdr">
              <span>&#128205; Location</span>
            </div>
            <div className="fp-val" style={{ fontFamily: "'DM Mono', monospace" }}>
              {f.location}
            </div>
          </div>
        )}

        {/* Source Evidence */}
        {hasSourceEvidence && (
          <div className="fp">
            <div className="fp-hdr" style={{ color: 'var(--teal)' }}>
              <span>
                &#128214; Source Evidence
                {f.sourceRef ? ' \u2014 ' + f.sourceRef : ''}
              </span>
            </div>
            <div className="ev-block">{f.sourceEvidence}</div>
          </div>
        )}

        {/* Issue */}
        <div className="fp">
          <div className="fp-hdr">
            <span>&#9888; Issue</span>
          </div>
          <div className="fp-val">{f.issue || '\u2014'}</div>
        </div>

        {/* Audit Risk */}
        {f.auditRisk && (
          <div className="fp" style={{ background: 'var(--red-tint)' }}>
            <div className="fp-hdr" style={{ color: 'var(--red)' }}>
              <span>&#9888; Audit Risk</span>
            </div>
            <div className="fp-val" style={{ color: 'var(--red)', fontStyle: 'italic' }}>
              {f.auditRisk}
            </div>
          </div>
        )}

        {/* Regulatory Impact */}
        {f.whyItMatters && (
          <div className="fp">
            <div className="fp-hdr">
              <span>&#9878; Regulatory Impact</span>
            </div>
            <div
              className="fp-val"
              style={{ fontStyle: 'italic', color: 'var(--mist)' }}
            >
              {f.whyItMatters}
            </div>
          </div>
        )}

        {/* Confidence */}
        {f.confidence != null && (
          <div className="fp" style={{ paddingBottom: 6 }}>
            <div className="fp-hdr">
              <span>Confidence</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color:
                    f.confidence >= 80
                      ? 'var(--emerald)'
                      : f.confidence >= 50
                        ? 'var(--amber)'
                        : 'var(--red)',
                }}
              >
                {f.confidence}%
              </span>
            </div>
            <div
              style={{
                height: 4,
                background: 'var(--fog)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: f.confidence + '%',
                  background:
                    f.confidence >= 80
                      ? 'var(--emerald)'
                      : f.confidence >= 50
                        ? 'var(--amber)'
                        : 'var(--red)',
                  borderRadius: 2,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        )}

        {/* Word Comment */}
        <div className="fp" style={{ background: 'rgba(26,86,219,.03)' }}>
          <div className="fp-hdr" style={{ color: 'var(--brand)' }}>
            <span>&#128172; Word Comment</span>
            <button
              className="cpy"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(f.comment || '');
                } catch {
                  /* fallback */
                }
              }}
            >
              Copy
            </button>
          </div>
          <div className="cmnt-block">&ldquo;{f.comment || '\u2014'}&rdquo;</div>
        </div>

        {/* Suggested Fix */}
        {f.suggestedFix && (
          <div className="fp">
            <div className="fp-hdr" style={{ color: 'var(--emerald)' }}>
              <span>&#128295; Suggested Fix</span>
            </div>
            <div className="fix-block">{f.suggestedFix}</div>
          </div>
        )}

        {/* Suggested Correction */}
        {f.suggestedCorrection && (
          <div className="fp">
            <div className="fp-hdr" style={{ color: 'var(--emerald)' }}>
              <span>&#9998; Suggested Correction</span>
              <button
                className="cpy"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(f.suggestedCorrection);
                  } catch {
                    /* fallback */
                  }
                }}
              >
                Copy
              </button>
            </div>
            <div className="fix-block">{f.suggestedCorrection}</div>
          </div>
        )}

        {/* Corrected Text */}
        {f.correctedText && (
          <div className="fp">
            <div className="fp-hdr" style={{ color: 'var(--violet)' }}>
              <span>&#9998; Corrected Text</span>
              <button
                className="cpy"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(f.correctedText);
                  } catch {
                    /* fallback */
                  }
                }}
              >
                Copy
              </button>
            </div>
            <div className="code-block">{f.correctedText}</div>
          </div>
        )}

        {/* Track Change */}
        {f.trackChange?.type &&
          f.trackChange.type !== 'none' &&
          f.trackChange.originalText && (
            <div className="fp">
              <div className="fp-hdr" style={{ color: 'var(--teal)' }}>
                <span>&#128260; Track Change</span>
              </div>
              <div className="fp-val">
                <span className="tc-del">{f.trackChange.originalText}</span>
                <span className="tc-ins">
                  &rarr; {f.trackChange.suggestedText}
                </span>
              </div>
            </div>
          )}

        {/* Disposition */}
        <div className="fp" style={{ background: 'var(--fog3)' }}>
          <div className="fp-hdr">
            <span>Disposition</span>
          </div>
          <div className="disp-row">
            <button
              className={`disp-btn disp-accept ${disposition?.status === 'accepted' ? 'sel' : ''}`}
              onClick={() => onSetDisp(f.id, 'accepted')}
            >
              &#10003; Accept
            </button>
            <button
              className={`disp-btn disp-reject ${disposition?.status === 'rejected' ? 'sel' : ''}`}
              onClick={() => onSetDisp(f.id, 'rejected')}
            >
              &#10007; Reject
            </button>
            <button
              className={`disp-btn disp-defer ${disposition?.status === 'deferred' ? 'sel' : ''}`}
              onClick={() => onSetDisp(f.id, 'deferred')}
            >
              &#8857; Defer
            </button>
            <input
              className="disp-note"
              placeholder="Add reviewer note\u2026"
              defaultValue={disposition?.note || ''}
              onBlur={e => onSaveNote(f.id, e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FindingsPanel({
  findings,
  dispositions,
  filterMode,
  onSetDisp,
  onSaveNote,
  onSetFilter,
  onReset,
}) {
  const filtered =
    filterMode === 'all'
      ? findings
      : findings.filter(
          f => f.severity === filterMode || f.type === filterMode
        );

  const filterChips = [
    { key: 'all', label: 'All' },
    { key: 'Critical', label: '\uD83D\uDD34 Critical' },
    { key: 'High', label: '\uD83D\uDD35 High' },
    { key: 'Medium', label: '\uD83D\uDFE1 Medium' },
    { key: 'Low', label: '\uD83D\uDFE2 Low' },
    { key: 'OBSERVATION', label: '\uD83D\uDD35 Obs.' },
    { key: 'OFI', label: '\uD83D\uDFE2 OFI' },
    { key: 'TRACEABILITY', label: 'Trace' },
    { key: 'ACCEPTANCE_CRITERIA', label: 'Acc. Criteria' },
    { key: 'EVIDENCE', label: 'Evidence' },
    { key: 'RISK_VALIDATION', label: 'Risk Val.' },
    { key: 'QA_GAP', label: 'QA Gap' },
    { key: 'LOGIC', label: 'Logic' },
    { key: 'REVISION_CONTROL', label: 'Rev. Control' },
    { key: 'SAMPLE_SIZE', label: 'Sample Size' },
  ];

  return (
    <div className="panel-r">
      <div className="pr-head">
        <span className="pr-title">Findings</span>
        <span className="pr-count">
          {filtered.length} finding{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {findings.length > 0 && (
        <div
          style={{
            padding: 8,
            borderBottom: '1px solid var(--fog)',
            flexShrink: 0,
          }}
        >
          <div className="filter-chips">
            {filterChips.map(chip => (
              <button
                key={chip.key}
                className={`chip ${filterMode === chip.key ? 'on' : ''}`}
                onClick={() => onSetFilter(chip.key)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="findings-list">
        {!findings.length ? (
          <div className="fc-empty">
            <div className="fc-empty-icon">&#128269;</div>
            <p>
              Start a review to see findings here.
              <br />
              Each finding includes source evidence,
              <br />
              regulatory reference, and Word comment.
            </p>
          </div>
        ) : !filtered.length ? (
          <div
            style={{
              textAlign: 'center',
              padding: 30,
              fontSize: 12,
              color: 'var(--mist2)',
            }}
          >
            No findings for this filter.
          </div>
        ) : (
          filtered.map((f, i) => (
            <FindingCard
              key={f.id || i}
              f={f}
              index={i}
              disposition={dispositions[f.id]}
              onSetDisp={onSetDisp}
              onSaveNote={onSaveNote}
            />
          ))
        )}
      </div>

      {findings.length > 0 && (
        <div
          style={{
            padding: 10,
            borderTop: '1px solid var(--fog)',
            flexShrink: 0,
          }}
        >
          <button className="new-btn" style={{ width: '100%' }} onClick={onReset}>
            &#8634; New Review
          </button>
        </div>
      )}
    </div>
  );
}
