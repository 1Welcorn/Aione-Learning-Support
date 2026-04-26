import React from 'react';
import type { Lesson } from '../../types/index';
import { motion } from 'framer-motion';
import { CheckCircle2, Lock, Unlock } from 'lucide-react';

interface LessonCardProps {
  lesson: Lesson;
  onClick?: () => void;
  idx: number;
}

export const LessonCard: React.FC<LessonCardProps & { isAdmin?: boolean, onToggleLock?: () => void }> = ({ lesson, onClick, idx, isAdmin, onToggleLock }) => {
  const isLocked = lesson.status === 'locked';
  const isCurrent = lesson.status === 'not_started';
  const isCompleted = lesson.status === 'completed';

  // Define qual imagem usar baseado no status: 3D para Concluído ou Atual, Outline apenas para Bloqueado
  const displayIcon = (isCompleted || isCurrent) ? lesson.icon3D : lesson.iconOutline;
  const hasIcon = !!displayIcon;

  return (
    <div style={{ position: 'relative' }}>
      <motion.div
        whileHover={!isLocked ? { scale: 1.05, y: -5 } : {}}
        className={`lesson-card-v5 ${isLocked ? 'is-locked' : ''} ${isCurrent ? 'is-current' : ''}`}
        onClick={onClick}
      >
        {isCompleted && (
          <div className="lesson-ribbon-v5">
            <span>CONCLUÍDO!</span>
          </div>
        )}

        {isCompleted && (
          <div className="lesson-check-badge-v5">
             <CheckCircle2 size={20} fill="#10b981" stroke="white" />
          </div>
        )}
        
        <div className="lesson-icon-v5">
          {hasIcon ? (
            <img 
              src={displayIcon} 
              alt={lesson.title}
              className={isCompleted ? 'animate-pop' : 'grayscale-soft'}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                 (e.target as any).style.display = 'none';
                 (e.target as any).parentElement.innerHTML = '<span style="font-size: 32px">📚</span>';
              }}
            />
          ) : (
            <span style={{ fontSize: '32px' }}>
              {lesson.status === 'completed' ? '🌟' : (isLocked ? '🔒' : '📚')}
            </span>
          )}
        </div>
        
        <div className="lesson-info-v5">
          <span className="lesson-id-tag">AULA {idx + 1}</span>
          <h3 className="lesson-title-v5">{lesson.title}</h3>
        </div>
        
        {!isLocked && (
          <div className="lesson-footer-v5">
             <div className="lesson-bar-v5">
                <div className="lesson-bar-fill-v5" style={{ width: isCompleted ? '100%' : (isCurrent ? '20%' : '0%') }} />
             </div>
             <span className="lesson-xp-v5">{lesson.xpValue}XP</span>
          </div>
        )}
        
        {isCurrent && (
          <button className="lesson-play-btn-v5">
            Começar Agora!
          </button>
        )}
      </motion.div>

      {isAdmin && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock?.();
          }}
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: isLocked ? '#ef4444' : '#10b981',
            color: 'white',
            border: '3px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            zIndex: 10
          }}
          title={isLocked ? "Desbloquear Unidade" : "Bloquear Unidade"}
        >
          {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>
      )}
    </div>
  );
};
