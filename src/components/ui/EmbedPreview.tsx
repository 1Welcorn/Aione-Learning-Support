import React, { useRef, useState, useImperativeHandle } from 'react';
import { Play, Sparkles } from 'lucide-react';

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
          <div className="embed-play-overlay">
            <div className="embed-play-btn">
              <Play size={40} fill="white" />
            </div>
            <span className="embed-play-label">CLIQUE PARA JOGAR</span>
          </div>

          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={title || 'Preview'} className="embed-thumbnail" />
          ) : (
            <div className="embed-board modern">
              <div className="embed-board-header">
                <Sparkles size={20} color="#6366f1" />
                <span>LIÇÃO INTERATIVA</span>
              </div>
              <div className="embed-board-body">
                <div className="embed-col">
                  <div className="embed-col-title">OBJETOS</div>
                  <div className="embed-card-v2"></div>
                  <div className="embed-card-v2"></div>
                </div>
                <div className="embed-col">
                  <div className="embed-col-title">AÇÕES</div>
                  <div className="embed-card-v2 accent"></div>
                  <div className="embed-card-v2"></div>
                </div>
                <div className="embed-col">
                  <div className="embed-col-title">TRADUÇÃO</div>
                  <div className="embed-card-v2"></div>
                  <div className="embed-card-v2 accent"></div>
                </div>
              </div>
              <div className="embed-board-footer">
                DESAFIO DE ASSOCIAÇÃO RÁPIDA
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
