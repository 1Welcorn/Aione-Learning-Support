import React, { useRef, useState, useImperativeHandle } from 'react';

export type EmbedPreviewHandle = {
  open: () => void;
  close: () => void;
};

const EmbedPreview = React.forwardRef<EmbedPreviewHandle, { url: string; title?: string; thumbnailUrl?: string }>((props, ref) => {
  const { url, title, thumbnailUrl } = props;
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const openFullscreen = () => {
    setOpen(true);
    setTimeout(() => {
      const el = modalRef.current;
      if (el && el.requestFullscreen) el.requestFullscreen().catch(() => {});
    }, 50);
  };

  const closeFullscreen = async () => {
    setOpen(false);
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch {}
    }
  };

  useImperativeHandle(ref, () => ({ open: openFullscreen, close: closeFullscreen }));

  return (
    <>
      <div className="embed-preview" role="button" onClick={openFullscreen}>
        <div className="embed-preview-inner">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={title || 'Preview'} className="embed-thumbnail" />
          ) : (
            <div className="embed-board">
              <div className="embed-col">
                <div className="embed-col-title">Objetos</div>
                <div className="embed-card">Drop OBJECT here</div>
              </div>
              <div className="embed-col">
                <div className="embed-col-title">Ações</div>
                <div className="embed-card">Drop ACTION here</div>
              </div>
              <div className="embed-col">
                <div className="embed-col-title">Traduções alinhadas</div>
                <div className="embed-card">A tradução fica alinhada com a ação</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="embed-modal" ref={modalRef}>
          <div className="embed-modal-inner">
            <button className="embed-modal-close" onClick={closeFullscreen}>✕</button>
            {/* Overlay corners to hide/cover small in-iframe controls (cross-origin) */}
            <div className="embed-overlay-corner top-right" aria-hidden="true" />
            <div className="embed-overlay-corner bottom-right" aria-hidden="true" />
            <iframe
              src={url}
              title={title || 'Atividade interativa'}
              allow="fullscreen; autoplay; clipboard-read; clipboard-write"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
});

export default EmbedPreview;
