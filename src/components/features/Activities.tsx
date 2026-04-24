import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Unit, Question } from '../../types';
import { COLORS } from '../../constants';
import { 
  Sparkles, Plus, FileText, ChevronDown, 
  Trash2, X, Info, Edit2,
  ChefHat, Headphones, User, Building2, Smartphone, BookOpen, GraduationCap,
  Maximize, Home, ChevronRight, ArrowLeft
} from 'lucide-react';
import { QuestionBlock } from './QuestionBlock';
import EmbedPreview from '../ui/EmbedPreview';
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
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [tempBrief, setTempBrief] = useState(unit.brief || '');
  const [tempLinks, setTempLinks] = useState<any[]>([]);
  const [stepReward, setStepReward] = useState(false);
  const [/*hintPos*/, /*setHintPos*/] = useState<null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewRef = React.useRef<any>(null);

  

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

  const missionByStepType: Record<StepType, string> = {
    game: 'Missao: Ganhe estrelas no desafio de palavras.',
    brief: 'Missao: Leia o guia e descubra o foco da aula.',
    embed: 'Missao: Complete a atividade interativa com atencao.',
    question: 'Missao: Responda com calma e mostre o que aprendeu.',
    report: 'Missao final: Conte como foi a aula de hoje.'
  };

  const mascotByStepType: Record<StepType, string> = {
    game: 'Vamos jogar!',
    brief: 'Vamos aprender!',
    embed: 'Hora da atividade!',
    question: 'Voce consegue!',
    report: 'Mandou bem!'
  };

  useEffect(() => {
    if (!stepReward) return;
    const timer = window.setTimeout(() => setStepReward(false), 1300);
    return () => window.clearTimeout(timer);
  }, [stepReward]);

  const handleNext = () => {
    if (!isLast) {
      setStepReward(true);
      setActiveStep(activeStep + 1);
    }
  };
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
    <div className="activities-v5-wrapper">
      {/* Immersive Top Progress */}
      <div className="activities-v5-header">
         <button className="back-btn-v5" onClick={onToggle}>
            <ArrowLeft size={20} />
            Sair da Aula
         </button>
         
         <div className="progress-segments-v5">
            {steps.map((_, i) => (
               <div 
                  key={i} 
                  className={`segment-v5 ${i === activeStep ? 'active' : ''} ${i < activeStep ? 'done' : ''}`}
               />
            ))}
         </div>

         <div className="unit-badge-v5">
            {unit.title}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="activities-v5-main">
        <div className="step-container-v5">
          {current.type === 'game' && (
            <div className="step-card-v5 game-launcher">
               <div className="game-visual-v5">🎮</div>
               <h2>Desafio de Palavras</h2>
               <p>Ganhe XP extra praticando o vocabulário desta lição!</p>
               <button className="play-btn-v5" onClick={onStartGame} style={{ background: currentColors.accent }}>
                  Começar Desafio!
               </button>
            </div>
          )}

          {current.type === 'brief' && (
            <div className="step-card-v5 brief">
              <div className="brief-header-v5">
                <div className="brief-mascot-v5">
                   <img src="https://i.ibb.co/PZNCmrTf/Captura-de-tela-2026-04-24-002158.png" alt="Explorer" />
                </div>
                <div className="brief-text-v5">
                   <span className="step-label-v5">ETAPA 1: PREPARAÇÃO</span>
                   <h2>Guia de Estudo</h2>
                </div>
              </div>

              <div className="brief-content-v5">
                {isAdmin && (
                  <button className="admin-edit-btn" onClick={() => setIsEditingBrief(!isEditingBrief)}>
                    {isEditingBrief ? 'X Cancelar' : '✎ Editar Conteúdo'}
                  </button>
                )}

                {isEditingBrief ? (
                  <div className="brief-editor-v5">
                    <textarea 
                      value={tempBrief}
                      onChange={(e) => setTempBrief(e.target.value)}
                      className="brief-textarea-v5"
                      autoFocus
                    />
                    <button 
                      className="save-btn-v5"
                      onClick={async () => {
                        const success = await handleUpdateUnitContent({ brief: tempBrief, external_links: tempLinks });
                        if (success) setIsEditingBrief(false);
                      }}
                    >
                      Salvar Tudo
                    </button>
                  </div>
                ) : (
                  <div className="brief-view-v5">
                     <p className="brief-paragraph-v5">{unit.brief}</p>
                     
                     <div className="media-grid-v5">
                        {unit.external_links?.filter(l => l.label === 'media' || l.label === 'HTML').map((media, idx) => (
                           <div key={idx} className="media-item-v5">
                              {media.url.includes('youtube.com') ? (
                                 <iframe src={media.url.replace('watch?v=', 'embed/')} frameBorder="0" allowFullScreen />
                              ) : media.label === 'HTML' ? (
                                 <div dangerouslySetInnerHTML={{ __html: media.url }} />
                              ) : (
                                 <img src={media.url} alt="Reference" />
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {current.type === 'embed' && (
            <div className="step-card-v5 embed">
               <div className="embed-header-v5">
                  <div className="embed-info-v5">
                     <span className="step-label-v5">ATIVIDADE INTERATIVA</span>
                     <h2>Mão na Massa!</h2>
                  </div>
                  <button className="fullscreen-btn-v5" onClick={() => previewRef.current?.open()}>
                     <Maximize size={18} />
                     Tela Cheia
                  </button>
               </div>
               
               <div className="embed-container-v5">
                  <EmbedPreview
                    ref={previewRef}
                    url={(current as EmbedStep).url}
                    title={`Atividade ${(current as EmbedStep).idx + 1}`}
                    thumbnailUrl={unit.embed_preview_images?.[(current as EmbedStep).idx]}
                  />
               </div>
            </div>
          )}

          {current.type === 'question' && (
            <div className="step-card-v5 question-step">
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
              {isAdmin && (
                <button className="admin-add-item-v5" onClick={() => {
                  const type = window.confirm('Adicionar QUESTÃO?') ? 'q' : 'e';
                  if (type === 'q') {
                    const newQ: Question = { q: 'Nova Pergunta', type: 'mc', opts: ['Opção 1'], mediator: '', hint: '' };
                    handleUpdateUnitContent({ questions: [...unit.questions, newQ] });
                  }
                }}>+ Adicionar Questão</button>
              )}
            </div>
          )}

          {current.type === 'report' && (
            <div className="step-card-v5 report">
               <div className="report-header-v5">
                  <div className="report-icon-v5"><FileText size={32} /></div>
                  <h2>Relatório Final</h2>
                  <p>Conte-nos como foi o desempenho da Ione hoje.</p>
               </div>
               <textarea 
                 className="report-textarea-v5"
                 value={note}
                 onChange={(e) => setNote(e.target.value)}
                 placeholder="Ex: Ione demonstrou facilidade com as cores..."
               />
               <button 
                 className={`finish-btn-v5 ${sessionSuccess ? 'success' : ''}`}
                 onClick={handleSaveSession}
                 disabled={!note.trim() || isSavingSession}
                 style={{ background: sessionSuccess ? '#10b981' : currentColors.main }}
               >
                 {isSavingSession ? 'Salvando...' : sessionSuccess ? 'Lição Concluída! 🎉' : 'Finalizar e Salvar'}
               </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Control Bar */}
      <div className="activities-v5-footer">
        <button 
          className="nav-control-btn-v5 prev"
          onClick={handleBack}
          disabled={isFirst}
        >
          <ArrowLeft size={20} />
          Anterior
        </button>

        <div className="step-info-v5">
           Passo {activeStep + 1} de {steps.length}
        </div>

        <button 
          className="nav-control-btn-v5 next"
          onClick={handleNext}
          disabled={isLast}
          style={{ background: currentColors.accent }}
        >
          Próximo
          <ChevronRight size={20} />
        </button>
      </div>

      {stepReward && (
        <div className="reward-popup-v5">
           ⭐ +10 XP
        </div>
      )}
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