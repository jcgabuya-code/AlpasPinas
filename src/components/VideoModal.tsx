import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';

type VideoModalProps = {
  open: boolean;
  onClose: () => void;
  src: string;
  poster?: string;
  title?: string;
};

/**
 * Themed modal that plays a video. Closes on ESC, on backdrop click, or via
 * the close button. Locks body scroll while open. Pauses the video on close.
 */
export const VideoModal: React.FC<VideoModalProps> = ({
  open,
  onClose,
  src,
  poster,
  title = 'Highlight reel',
}) => {
  const { theme } = useTheme();
  const c = colors[theme];
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ESC to close + body scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Pause + reset when closed
  useEffect(() => {
    if (!open && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'alpas-fade-in 160ms ease-out',
      }}
    >
      {/* Inline keyframes — keeps the modal self-contained */}
      <style>{`
        @keyframes alpas-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes alpas-pop-in {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1080px',
          aspectRatio: '16 / 9',
          backgroundColor: '#000',
          borderRadius: '0.85rem',
          overflow: 'hidden',
          border: `1px solid ${c.border}`,
          boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px ${c.primary}22`,
          animation: 'alpas-pop-in 200ms ease-out',
        }}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          controls
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'contain',
            backgroundColor: '#000',
          }}
        />

        <button
          onClick={onClose}
          aria-label="Close video"
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '999px',
            border: `1px solid ${c.border}`,
            backgroundColor: 'rgba(11, 16, 20, 0.75)',
            color: '#fff',
            fontSize: '1.1rem',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};
