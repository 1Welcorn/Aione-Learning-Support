import React from 'react';
import { Lesson } from '../../types';
import { motion } from 'framer-motion';

interface LessonCardProps {
  lesson: Lesson;
  onClick?: () => void;
  idx: number;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, onClick, idx }) => {
  const isLocked = lesson.status === 'locked';
  const isCurrent = lesson.status === 'not_started';
  const isCompleted = lesson.status === 'completed';

  // Define qual imagem usar baseado no status
  const displayIcon = isCompleted ? lesson.icon3D : lesson.iconOutline;

  return (
    <motion.div
      whileHover={!isLocked ? { scale: 1.05, y: -5 } : {}}
      className={`lesson-card-v5 ${isLocked ? 'is-locked' : ''} ${isCurrent ? 'is-current' : ''}`}
      onClick={onClick}
    >
      <div className="lesson-icon-v5">
        <img 
          src={displayIcon} 
          alt={lesson.title}
          className={isCompleted ? 'animate-pop' : 'grayscale-soft'}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onError={(e) => {
             // Fallback to a default if image fails
             (e.target as any).style.display = 'none';
             (e.target as any).parentElement.innerHTML = '<span style="font-size: 32px">📚</span>';
          }}
        />
      </div>
      
      <span className="lesson-id-tag">Aula {idx + 1}</span>
      <h3 className="lesson-title-v5">{lesson.title}</h3>
      
      {!isLocked && (
        <div className="lesson-progress-v5">
           <div className="lesson-bar-bg">
              <div className="lesson-bar-fill" style={{ width: isCompleted ? '100%' : (isCurrent ? '30%' : '0%') }} />
           </div>
           <span className="lesson-xp-tag">{lesson.xpValue} XP</span>
        </div>
      )}
      
      {isCurrent && (
        <button className="lesson-play-btn">
          COMEÇAR AGORA!
        </button>
      )}
    </motion.div>
  );
};
