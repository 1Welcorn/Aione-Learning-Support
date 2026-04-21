import { Star, CheckCircle2, Trophy, Sparkles, MessageCircle, Flame, Rocket, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudentJourney } from '../../hooks/useStudentJourney';
import { useDashboardData } from '../../hooks/useDashboardData';

interface DashboardProps {
  onNavigate: (screen: string, unitId?: string) => void;
  completedPct: number;
  sessionsCount: number;
  mediatorName: string;
  mediatorPhone: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  completedPct,
  sessionsCount,
  mediatorName,
  mediatorPhone,
}) => {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useStudentJourney(user?.id || '');
  const { units, loading: journeyLoading } = useDashboardData(user?.id || '');

  // Dynamic values from Supabase stats
  const currentLevel = stats?.level || 1;
  const currentStreak = stats?.streak || 0;
  const totalStars = stats?.stars || (sessionsCount * 10);

  const handleSupportClick = () => {
    const text = `Olá Prof. ${mediatorName}, sou a Ione! Preciso de uma ajuda com as atividades de hoje.`;
    const cleanPhone = mediatorPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const nextUnit = units.find(u => u.unit_status !== 'completed') || units[0];

  if (journeyLoading || statsLoading) return <div className="screen-loading">Carregando sua jornada...</div>;

  return (
    <div className="screen-home platform-view landing-style">
      {/* HERO SECTION - PROFILE CARD */}
      <div className="adventure-header">
        <div className="kid-profile">
          <div className="kid-avatar-wrapper">
             <div className="kid-avatar">I</div>
             <div className="kid-level">Lvl {currentLevel}</div>
          </div>
          <div className="kid-text">
            <h1 className="kid-name">Oi, Ione! 🌟</h1>
            <p className="kid-sub">Você já completou {completedPct}% da aventura!</p>
          </div>
        </div>

        <div className="kid-stats">
          <div className="kid-stat-pill orange">
            <Star size={20} fill="currentColor" />
            <span>{totalStars}</span>
          </div>
          <div className="kid-stat-pill blue">
            <Flame size={20} fill="currentColor" />
            <span>{currentStreak} Dias</span>
          </div>
        </div>
      </div>

      {/* FLOATING MISSION CARD */}
      <div className="mission-island-container">
        <div className="mission-island" onClick={() => onNavigate('activities', nextUnit?.unit_id)}>
          <div className="mission-tag-v4">SUA MISSÃO AGORA</div>
          <h2 className="mission-title-v4">{nextUnit?.unit_title || 'Unidade 1'}</h2>
          <p className="mission-subtitle-v4">"{nextUnit?.unit_sub?.split('·')[0]?.trim() || 'Vamos aprender algo novo?'}"</p>
          
          <button className="mission-go-btn">
            COMEÇAR! <Play size={20} fill="currentColor" />
          </button>
          
          <div className="mission-decoration">
            <Rocket size={80} color="rgba(255,255,255,0.2)" />
          </div>
        </div>
      </div>

      {/* ADVENTURE TRAIL */}
      <div className="adventure-trail-section">
        <div className="trail-title-group">
          <h2 className="trail-title">Caminho do Conhecimento</h2>
          <div className="trail-subtitle">Siga os passos para ganhar estrelas!</div>
        </div>

        <div className="adventure-path">
          <div className="path-line-main"></div>
          
          {units.map((unit, idx) => {
             const isDone = unit.unit_status === 'completed';
             const isLocked = idx > 0 && units[idx-1].unit_status !== 'completed';
             
             const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#FF8E3C', '#2ECC71'];
             const color = colors[idx % colors.length];

             return (
              <div 
                key={unit.unit_id} 
                className={`adventure-node ${isDone ? 'is-complete' : ''} ${isLocked ? 'is-locked' : ''} ${idx % 2 === 0 ? 'left' : 'right'}`}
                onClick={() => !isLocked && onNavigate('activities', unit.unit_id)}
              >
                <div className="island-node" style={{ backgroundColor: isLocked ? '#E2E8F0' : color }}>
                   <div className="island-icon">
                      {isDone ? <CheckCircle2 size={32} /> : 
                       isLocked ? <Trophy size={32} /> : 
                       <Sparkles size={32} />}
                   </div>
                   {isDone && <div className="island-badge">✓</div>}
                </div>
                
                <div className="island-info">
                   <div className="island-unit-num">MÓDULO {idx + 1}</div>
                   <h3 className="island-title">{unit.unit_title}</h3>
                   <div className="island-progress">
                      <div className="progress-bar-mini">
                         <div className="progress-fill-mini" style={{ width: isDone ? '100%' : '20%', backgroundColor: color }}></div>
                      </div>
                      <span>{isDone ? 'Concluído' : 'Em progresso'}</span>
                   </div>
                </div>
              </div>
             );
          })}
        </div>
      </div>

      {/* MEDIATOR SUPPORT CARD */}
      <div className="mediator-support-section">
        <div className="section-header">
          <h2 className="section-title">Acompanhamento</h2>
          <p className="section-subtitle">Sua mediadora está aqui para te ajudar em cada passo.</p>
        </div>

        <div className="mediator-card">
          <div className="med-avatar-container">
            <div className="med-avatar-circle">
               {mediatorName.charAt(0)}
            </div>
            <div className="med-status-dot"></div>
          </div>
          
          <div className="med-details">
            <h3 className="med-name">Prof. {mediatorName}</h3>
            <p className="med-role">Mediadora de Aprendizado</p>
          </div>

          <button className="med-whatsapp-btn" onClick={handleSupportClick}>
            <MessageCircle size={20} />
            <span>Chamar no WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
