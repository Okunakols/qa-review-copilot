'use client';

export default function Chrome({ revId, cfg, onSettings, onHistory }) {
  const initials = (cfg.author || '\u2014').split(' ').map(w => w[0] || '').join('').slice(0, 2) || '\u2014';
  return (
    <div className="chrome">
      <div className="wordmark">
        <div className="wm-icon">
          <svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div className="wm-name">DocuReview</div>
        <span className="wm-badge">AI</span>
      </div>
      <div className="chrome-mid">
        <div className="review-id">Review ID <span>{revId || '\u2014'}</span></div>
      </div>
      <div className="chrome-r">
        <div className="chrome-user">
          <div className="avatar">{initials}</div>
          <span>{cfg.author || '\u2014'}</span>
        </div>
        <button className="ghost-btn" onClick={onSettings}>Settings</button>
        <button className="ghost-btn" onClick={onHistory}>History</button>
      </div>
    </div>
  );
}
