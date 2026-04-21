import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Unit, Question } from '../../types';
import { COLORS } from '../../constants';
import { 
  Sparkles, Plus, FileText, ChevronDown, 
  Trash2, X, Info, Edit2,
  ChefHat, Headphones, User, Building2, Smartphone, BookOpen, GraduationCap,
  Maximize, Home, ChevronRight
} from 'lucide-react';
import { QuestionBlock } from './QuestionBlock';
import { useAuth } from '../../context/AuthContext';
import { useStudentJourney } from '../../hooks/useStudentJourney';
import WordFallGame from './WordFallGame';

type StepType = 'game' | 'brief' | 'embed' | 'question' | 'report';

interface BaseStep {
  type: StepType;
}

interface GameStep extends BaseStep {
  type: 'game';
}

interface BriefStep extends BaseStep {
  type: 'brief';
}

interface EmbedStep extends BaseStep {
  type: 'embed';
  url: string;
  idx: number;
}

interface QuestionStep extends BaseStep {
  type: 'question';
  q: Question;
  idx: number;
}

interface ReportStep extends BaseStep {
  type: 'report';
}

type StepContent = GameStep | BriefStep | EmbedStep | QuestionStep | ReportStep;

const normalizeEmbedUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);

    if (url.hostname.includes('drive.google.com')) {
      url.pathname = url.pathname.replace(/\/view$/, '/preview');
      return url.toString();
    }

    if (url.hostname.includes('youtube.com') && url.pathname === '/watch') {
      const videoId = url.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    if (url.hostname.includes('youtu.be')) {
      const videoId = url.pathname.replace('/', '');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    return url.toString();
  } catch {
    return trimmed;
  }
};

// --- STEP NAVIGATION COMPONENT (ONE CARD AT A TIME) ---
const StepNavigation: React.FC<{
  unit: Unit;
  answers: Record<string, any>;
  onSaveAnswer: (qIdx: number, val: string) => Promise<boolean>;
  isAdmin?: boolean;
  editQuestion: (idx: number, newQ: Question) => void;
  deleteQuestion: (idx: number) => void;
  currentColors: any;
  onStartGame?: () => void;
  handleUpdateUnitContent: (updates: Partial<Unit>) => void;
  onSaveSession: (note: string) => Promise<boolean>;
  onToggle: () => void;
  completeLesson: (uId: string, xp: number) => Promise<any>;
  isFirstUnit?: boolean;
}> = ({ unit, answers, onSaveAnswer, isAdmin, editQuestion, deleteQuestion, currentColors, onStartGame, handleUpdateUnitContent, onSaveSession, onToggle, completeLesson, isFirstUnit }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [note, setNote] = useState('');
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [hintPos, setHintPos] = useState<{ top: number; left: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFirstUnit || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setHintPos({ top: rect.top + rect.height / 2 - 16, left: rect.right + 8 });
  }, [isFirstUnit, activeStep]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Group all content into steps
  const embeds = (unit.embed_urls || [])
    .map(normalizeEmbedUrl)
    .filter(u => u.trim());
  const steps: StepContent[] = [
    // Step 0: Game Launcher (optional)
    ...(isAdmin ? [] : [{ type: 'game' as const }]),
    // Next: Brief/Instructions
    ...(unit.brief ? [{ type: 'brief' as const }] : []),
    // Next: All embeds
    ...embeds.map((url, i): EmbedStep => ({ type: 'embed', url, idx: i })),
    // Next: All questions
    ...unit.questions.map((q, i): QuestionStep => ({ type: 'question', q, idx: i })),
    // Final Step: Report
    { type: 'report' } as ReportStep
  ];

  const current = steps[activeStep] as StepContent;
  const isLast = activeStep === steps.length - 1;
  const isFirst = activeStep === 0;

  const handleNext = () => { if (!isLast) setActiveStep(activeStep + 1); };
  const handleBack = () => { if (!isFirst) setActiveStep(activeStep - 1); };

  const handleSaveSession = async () => {
    if (!note.trim() || isSavingSession) return;
    setIsSavingSession(true);
    const success = await onSaveSession(note);
    setIsSavingSession(false);
    
    if (success) {
      await completeLesson(unit.id, 50);
      setSessionSuccess(true);
      setNote('');
      setTimeout(() => {
        setSessionSuccess(false);
        onToggle();
      }, 2000);
    }
  };

  return (
    <div className="step-nav-v4">
      {/* Progress Bar Top */}
      <div className="step-progress-v4">
        <div className="step-progress-track">
          <div 
            className="step-progress-fill" 
            style={{ width: `${(activeStep / (steps.length - 1)) * 100}%`, background: currentColors.accent }}
          />
        </div>
        <div className="step-counter-v4">
          ETAPA {activeStep + 1} DE {steps.length}
        </div>
      </div>

      <div className="step-content-v4">
        {current.type === 'game' && (
          <div className="game-launcher-card-v4" onClick={onStartGame} style={{ background: currentColors.light }}>
             <div className="game-icon-v4">🎮</div>
             <div className="game-info-v4">
                <h4 style={{ color: currentColors.dark }}>DESAFIO WORD FALL!</h4>
                <p>Pratique as palavras desta lição e ganhe estrelas!</p>
             </div>
             <button className="play-game-btn-v4" style={{ background: currentColors.accent }}>JOGAR AGORA!</button>
          </div>
        )}

        {current.type === 'brief' && (
          <div className="step-card-v4 brief">
            <div className="step-header-v4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Info size={24} style={{ color: currentColors.accent }} />
                <h3>Guia de Estudo</h3>
              </div>
              {isAdmin && (
                <button className="admin-btn-v4" onClick={() => {
                  const val = window.prompt('Editar Guia da Mediadora:', unit.brief);
                  if (val !== null) handleUpdateUnitContent({ brief: val });
                }}><Edit2 size={16} /></button>
              )}
            </div>
            <div className="step-body-v4 brief-text">
              {unit.brief}
            </div>
          </div>
        )}

        {current.type === 'embed' && (
          <div className="step-card-v4 embed">
            <div className="step-header-v4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Sparkles size={24} style={{ color: currentColors.accent }} />
                <h3>Atividade Interativa {(current as EmbedStep).idx + 1}</h3>
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                  <button 
                    ref={btnRef}
                    className="fullscreen-btn-v4" 
                    onClick={() => {
                      const el = document.getElementById(`embed-container-${(current as EmbedStep).idx}`);
                      if (el?.requestFullscreen) el.requestFullscreen();
                    }}
                    title="Tela Cheia"
                  >
                    <Maximize size={18} />
                  </button>
                  {isFirstUnit && hintPos && (
                    <div
                      className="fullscreen-hint-arrow"
                      style={{ top: hintPos.top, left: hintPos.left }}
                    >
                      <span className="hint-arrow">←</span>
                      <span className="hint-label">Tela cheia</span>
                    </div>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="admin-btn-v4" onClick={() => {
                    const val = window.prompt('Editar Link da Atividade:', (current as EmbedStep).url);
                    if (val !== null) {
                      const next = [...(unit.embed_urls || [])];
                      next[(current as EmbedStep).idx] = val;
                      handleUpdateUnitContent({ embed_urls: next });
                    }
                  }}><Edit2 size={16} /></button>
                  <button className="admin-btn-v4 del" onClick={() => {
                    if (window.confirm('Excluir esta atividade?')) {
                      const next = [...(unit.embed_urls || [])];
                      next.splice((current as EmbedStep).idx, 1);
                      handleUpdateUnitContent({ embed_urls: next });
                    }
                  }}><Trash2 size={16} /></button>
                </div>
              )}
            </div>
            <div className="iframe-responsive-v4" id={`embed-container-${(current as EmbedStep).idx}`} style={{ position: 'relative' }}>
              {isFullscreen && (
                <button
                  className="exit-fullscreen-btn"
                  onClick={() => document.exitFullscreen()}
                  title="Sair da Tela Cheia"
                >
                  ✕ Sair
                </button>
              )}
              <iframe
                src={(current as EmbedStep).url}
                allow="fullscreen; autoplay; clipboard-read; clipboard-write"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
              <a
                href={(current as EmbedStep).url}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn-v4"
                style={{ textDecoration: 'none' }}
              >
                Abrir atividade em nova aba
              </a>
            </div>
          </div>
        )}

        {current.type === 'question' && (
          <QuestionBlock 
            question={(current as QuestionStep).q}
            index={(current as QuestionStep).idx}
            unitId={unit.id}
            color={unit.color}
            isDone={!!answers[`${unit.id}-${(current as QuestionStep).idx}`]?.is_done}
            savedAnswer={answers[`${unit.id}-${(current as QuestionStep).idx}`]?.answer_value || ''}
            onSaveAnswer={(val) => onSaveAnswer((current as QuestionStep).idx, val)}
            isAdmin={isAdmin}
            onEdit={(newQ) => editQuestion((current as QuestionStep).idx, newQ)}
            onDelete={() => deleteQuestion((current as QuestionStep).idx)}
            isNew={(current as QuestionStep).q.q === 'Nova Pergunta'}
          />
        )}

        {current.type === 'report' && (
          <div className="step-card-v4 report">
            <div className="step-header-v4">
              <FileText size={24} style={{ color: currentColors.main }} />
              <h3>Relatório de Atendimento</h3>
            </div>
            <p className="report-subtitle-v4">Finalize a lição descrevendo o desempenho da aluna.</p>
            <textarea 
              className="report-textarea-v4"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Ione demonstrou facilidade com o vocabulário..."
            />
            <button 
              className={`save-report-btn-v4 ${sessionSuccess ? 'success' : ''}`}
              onClick={handleSaveSession}
              disabled={!note.trim() || isSavingSession}
              style={{ background: sessionSuccess ? 'var(--teal2)' : currentColors.main }}
            >
              {isSavingSession ? 'Salvando...' : sessionSuccess ? 'Lição Concluída!' : 'Salvar e Finalizar'}
            </button>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="step-footer-v4">
        <button 
          className={`nav-btn-v4 back ${isFirst ? 'disabled' : ''}`}
          onClick={handleBack}
          disabled={isFirst}
        >
          <ChevronDown size={24} style={{ transform: 'rotate(90deg)' }} /> Voltar
        </button>

        <div className="admin-step-actions">
          {isAdmin && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="nav-btn-v4 admin-plus" onClick={() => {
                const type = window.confirm('Deseja adicionar uma QUESTÃO? (Cancelar para adicionar ATIVIDADE CANVA/LINK)') ? 'q' : 'e';
                if (type === 'q') {
                  const newQ: Question = { q: 'Nova Pergunta', type: 'mc', opts: ['Opção 1'], mediator: '', hint: '' };
                  handleUpdateUnitContent({ questions: [...unit.questions, newQ] });
                } else {
                  const url = window.prompt('Cole o link da atividade (Canva/HTML):');
                  if (url) handleUpdateUnitContent({ embed_urls: [...(unit.embed_urls || []), url] });
                }
              }} title="Adicionar Novo Item">
                <Plus size={24} />
              </button>
            </div>
          )}
        </div>

        <button 
          className={`nav-btn-v4 next ${isLast ? 'disabled' : ''}`}
          onClick={handleNext}
          disabled={isLast}
          style={{ background: currentColors.accent }}
        >
          {isLast ? 'Fim da Aula' : 'Próximo'} <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

interface UnitCardProps {
  unit: Unit;
  answers: Record<string, any>;
  onSaveAnswer: (qIdx: number, val: string) => Promise<boolean>;
  onSaveSession: (note: string) => Promise<boolean>;
  isAdmin?: boolean;
  onUpdateUnit?: (id: string, updates: Partial<Unit>) => Promise<boolean>;
  isExpanded: boolean;
  onToggle: () => void;
  onStartGame?: () => void;
  onGoHome?: () => void;
  isLocked?: boolean;
  isFirstUnit?: boolean;
  id?: string;
}

const getUnitIcon = (title: string, isLocked: boolean = false) => {
  const t = title.toLowerCase();
  
  let baseFilename = '';
  if (t.includes('cozinha') || t.includes('palavras da cozinha')) baseFilename = 'Aula 1 Vocabulário da Cozinha';
  else if (t.includes('compreensão oral') || t.includes('escuta')) baseFilename = 'Aula 2 Compreensão Oral';
  else if (t.includes('apresentação pessoal') || t.includes('nome')) baseFilename = 'Aula 3 Apresentação Pessoal';
  else if (t.includes('cotidiano') || t.includes('inglês no cotidiano')) baseFilename = 'Aula 4 Inglês no Cotidiano';
  else if (t.includes('digitais') || t.includes('gêneros')) baseFilename = 'Aula 5 Gêneros Digitais';
  else if (t.includes('receita')) baseFilename = 'Aula 6 Receita';
  else if (t.includes('cores') || t.includes('frutas')) baseFilename = 'Aula 7 Cores e Frutas';
  else if (t.includes('números') || t.includes('quantidade')) baseFilename = 'Aula 8 Números e Quantidade';

  if (baseFilename) {
    let lockedSuffix = '-não iniciada';
    if (baseFilename === 'Aula 6 Receita') {
       lockedSuffix = '-atividade não iniciada';
    }
    const imagePath = `/unit-icons/${baseFilename}${isLocked ? lockedSuffix : ''}.png`;
    return (
      <img 
        src={imagePath} 
        alt={title} 
        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }} 
      />
    );
  }

  // Fallbacks
  if (t.includes('cozinha') || t.includes('kitchen')) return <ChefHat size={36} strokeWidth={1.5} />;
  if (t.includes('escuta') || t.includes('listening') || t.includes('família')) return <Headphones size={36} strokeWidth={1.5} />;
  if (t.includes('nome') || t.includes('gosto') || t.includes('perfil') || t.includes('intro')) return <User size={36} strokeWidth={1.5} />;
  if (t.includes('redor') || t.includes('city') || t.includes('around') || t.includes('cidade')) return <Building2 size={36} strokeWidth={1.5} />;
  if (t.includes('celular') || t.includes('digital') || t.includes('phone')) return <Smartphone size={36} strokeWidth={1.5} />;
  if (t.includes('receita') || t.includes('book') || t.includes('estudo')) return <BookOpen size={36} strokeWidth={1.5} />;
  return <GraduationCap size={36} strokeWidth={1.5} />;
};

export const UnitCard: React.FC<UnitCardProps> = ({ 
  unit, answers, onSaveAnswer, onSaveSession, isAdmin, onUpdateUnit, isExpanded, onToggle, onStartGame, onGoHome, isLocked, isFirstUnit, id
}) => {
  // const [note, setNote] = useState('');
  // const [sessionSuccess, setSessionSuccess] = useState(false);
  
  // These are for future admin features or partially implemented ones
  // const [editingEmbedIdx, setEditingEmbedIdx] = useState<number | null>(null);
  // const [tempEmbedUrl, setTempEmbedUrl] = useState('');
  // const [showBrief, setShowBrief] = useState(false);
  // const [isEditingBrief, setIsEditingBrief] = useState(false);
  // const [tempBrief, setTempBrief] = useState(unit.brief || '');

  const currentColors = COLORS[unit.color] || COLORS.emerald || { main: '#10b981', light: '#ecfdf5', dark: '#064e3b' };

  const handleUpdateUnitContent = async (updates: Partial<Unit>) => {
    if (onUpdateUnit) {
      await onUpdateUnit(unit.id, updates);
    }
  };

  const deleteQuestion = (idx: number) => {
    if (window.confirm('Excluir esta pergunta permanentemente?')) {
      const newQs = [...unit.questions];
      newQs.splice(idx, 1);
      handleUpdateUnitContent({ questions: newQs });
    }
  };

  const editQuestion = (idx: number, newQ: Question) => {
    const newQs = [...unit.questions];
    newQs[idx] = newQ;
    handleUpdateUnitContent({ questions: newQs });
  };

  /*
  const deleteEmbed = (idx: number) => {
    if (window.confirm('Excluir este link interativo?')) {
    const newUrls = [...(unit.embed_urls || [])];
    newUrls.splice(idx, 1);
      handleUpdateUnitContent({ embed_urls: newUrls });
    }
  };

  const saveEmbedEdit = (idx: number) => {
    const newUrls = [...(unit.embed_urls || [])];
    newUrls[idx] = tempEmbedUrl;
    handleUpdateUnitContent({ embed_urls: newUrls });
    setEditingEmbedIdx(null);
  };
  */

  const { user } = useAuth();
  const { completeLesson } = useStudentJourney(user?.id || '');

  /*
  const handleSaveSession = async () => {
    ...
  };
  */

  const questionsDone = useMemo(() => {
    return unit.questions.filter((_, i) => answers[`${unit.id}-${i}`]?.is_done).length;
  }, [unit, answers]);

  const isComplete = questionsDone === unit.questions.length;

  return (
    <div id={id} className={`adventure-card ${isExpanded ? 'expanded' : ''} ${isLocked ? 'locked' : ''}`} style={{ borderBottomColor: currentColors.main, '--unit-color': currentColors.main } as any}>
      <div className="unit-hdr-v4" onClick={() => !isLocked && onToggle()}>
        <button 
          className="unit-home-btn-v4"
          onClick={(e) => {
            e.stopPropagation();
            if (isLocked) return;
            if (onGoHome) onGoHome();
          }}
          style={{ background: isLocked ? '#94a3b8' : currentColors.main }}
          title={isLocked ? "Unidade Bloqueada" : "Voltar ao Início"}
          disabled={isLocked}
        >
          {isLocked ? <X size={20} /> : <Home size={22} />}
        </button>

        <div className="unit-icon-island" style={{ background: currentColors.light, color: currentColors.accent }}>
          {getUnitIcon(unit.title, isLocked)}
        </div>

        <div className="unit-content-v4">
          <div className="unit-header-top-v4">
            <p className="unit-status-text" style={{ color: currentColors.dark }}>
              {isComplete ? 'MODULO CONCLUÍDO ✓' : 'MÓDULO EM PROGRESSO'}
            </p>
            <h3 className="unit-title-v4">
              {unit.title}
            </h3>
          </div>

          <div className="unit-info-v4">
            <p className="unit-meta-v4">{unit.sub?.split('·')[0]}</p>
            
            <div className="unit-tags-row-v4">
              {Array.isArray(unit.descriptors) && unit.descriptors.map(tag => (
                <span key={tag} className="skill-badge-v4" style={{ '--badge-bg': currentColors.accent } as any}>
                  {getSkillBadge(tag)}
                </span>
              ))}
            </div>

            <div className="unit-footer-v4">
              <div className="unit-progress-bar-v4">
                <div className="unit-progress-fill-v4" style={{ width: `${(questionsDone/unit.questions.length)*100}%`, background: currentColors.accent }}></div>
              </div>
              <span className="unit-progress-text-v4">{questionsDone}/{unit.questions.length}</span>
            </div>
          </div>
        </div>
        
        <div className="unit-chevron-v4">
           {isLocked ? (
             <X size={24} className="chev-v4 lock" />
           ) : (
             <ChevronDown size={24} className={`chev-v4 ${isExpanded ? 'open' : ''}`} />
           )}
        </div>
      </div>

        {isExpanded && (
        <div className="unit-body-v4">
          <StepNavigation 
            unit={unit} 
            answers={answers} 
            onSaveAnswer={onSaveAnswer}
            isAdmin={isAdmin}
            editQuestion={editQuestion}
            deleteQuestion={deleteQuestion}
            currentColors={currentColors}
            onStartGame={onStartGame}
            handleUpdateUnitContent={handleUpdateUnitContent}
            onSaveSession={onSaveSession}
            onToggle={onToggle}
            completeLesson={completeLesson}
            isFirstUnit={isFirstUnit}
          />
        </div>
      )}
    </div>
  );
};

// Local helper for skill badges mapping
export const getSkillBadge = (tag: string) => {
  const map: Record<string, string> = {
    'D2': 'Vocabulário 🍎',
    'D3': 'Gramática ✍️',
    'D5': 'Escuta 🎧',
    'D10': 'Conversa 🗣️'
  };
  return map[tag] || tag;
};

export const Activities: React.FC<{ 
  units: Unit[]; 
  answers: Record<string, any>; 
  onSaveAnswer: (uId: string, qIdx: number, val: string) => Promise<boolean>; 
  onSaveSession: (uId: string, note: string) => Promise<boolean>;
  isAdmin?: boolean;
  onUpdateUnit?: (uId: string, updates: Partial<Unit>) => Promise<boolean>;
  onCreateUnit?: (title: string) => Promise<boolean>;
  onGameOver?: (score: number, words: number) => void;
  initialExpandedId?: string | null;
  onGoHome?: () => void;
}> = ({ units, answers, onSaveAnswer, onSaveSession, isAdmin, onUpdateUnit, onCreateUnit, onGameOver, initialExpandedId, onGoHome }) => {
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(initialExpandedId ?? null);
  const [activeGameUnitId, setActiveGameUnitId] = useState<string | null>(null);

  React.useEffect(() => {
    setExpandedUnitId(initialExpandedId ?? null);
  }, [initialExpandedId]);

  const isFirstRender = React.useRef(true);
  
  // Always start at the exact top position when the page loads
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);


  React.useEffect(() => {
    if (expandedUnitId) {
      console.log('Centering unit:', expandedUnitId);
      const behavior = isFirstRender.current ? 'instant' : 'smooth';
      const timer = setTimeout(() => {
        const element = document.getElementById(`unit-${expandedUnitId}`);
        if (element) {
          element.scrollIntoView({ behavior, block: 'start' });
        }
        isFirstRender.current = false;
      }, isFirstRender.current ? 10 : 100);
      return () => clearTimeout(timer);
    } else {
      isFirstRender.current = false;
    }
  }, [expandedUnitId]);

  
  const handleCreateUnit = async () => {
    const title = window.prompt('Qual o título da nova unidade?');
    if (title && onCreateUnit) {
      await onCreateUnit(title);
    }
  };

  const sortedUnits = useMemo(() => {
    return [...units].sort((a, b) => {
      const numA = parseInt(a.title.match(/\d+/)?.[0] || '999');
      const numB = parseInt(b.title.match(/\d+/)?.[0] || '999');
      
      if (numA !== numB) return numA - numB;
      
      // Fallback to sort_order if numbers are same or missing
      if (a.sort_order !== undefined && b.sort_order !== undefined) {
        return a.sort_order - b.sort_order;
      }
      return 0;
    });
  }, [units]);

  return (
    <div className={`screen activities-screen ${expandedUnitId ? 'has-expanded' : ''}`}>
      <div className="unit-grid-container">
        {sortedUnits.map((unit, index) => {
          const isFirst = index === 0;
          const prevUnit = index > 0 ? sortedUnits[index - 1] : null;
          
          // Check if previous unit is complete
          const prevComplete = prevUnit ? prevUnit.questions.every((_, i) => answers[`${prevUnit.id}-${i}`]?.is_done) : true;
          const isLocked = !isFirst && !prevComplete && !isAdmin;

          return (
            <UnitCard 
              key={unit.id} 
              id={`unit-${unit.id}`}
              unit={unit} 
              answers={answers}
              onSaveAnswer={(qIdx, val) => onSaveAnswer(unit.id, qIdx, val)}
              onSaveSession={(note) => onSaveSession(unit.id, note)}
              isAdmin={isAdmin}
              onUpdateUnit={onUpdateUnit}
              isExpanded={expandedUnitId === unit.id}
              onToggle={() => setExpandedUnitId(expandedUnitId === unit.id ? null : unit.id)}
              onStartGame={() => setActiveGameUnitId(unit.id)}
              onGoHome={onGoHome}
              isLocked={isLocked}
              isFirstUnit={isFirst}
            />
          );
        })}
      </div>

      {activeGameUnitId && (
        <div className="game-screen-overlay">
          <WordFallGame 
            unitId={activeGameUnitId} 
            onGameOver={(s, w) => {
              if (onGameOver) onGameOver(s, w);
            }}
            onBack={() => setActiveGameUnitId(null)}
          />
        </div>
      )}

      {isAdmin && (
        <div style={{ padding: '0 16px 40px' }}>
          <button 
            className="admin-add-btn premium" 
            onClick={handleCreateUnit}
            style={{ width: '100%', padding: '18px' }}
          >
            <Plus size={20} /> Criar Nova Unidade / Aula
          </button>
        </div>
      )}
    </div>
  );
};