import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useLang } from '../i18n';
import './CommercialAgentWidget.css';
import { trackClarityEvent } from '../analytics/clarity';

/**
 * LumyoRobotIcon — Ícone de robô futurista em SVG inline.
 */
function LumyoRobotIcon({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Antena */}
      <line x1="12" y1="1.5" x2="12" y2="4.5" stroke="#ff2d78" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="1.5" r="1.2" fill="#ff2d78" />

      {/* Orelhas / Conectores laterais */}
      <rect x="2" y="10" width="1.5" height="4" rx="0.75" fill="#3d62ff" />
      <rect x="20.5" y="10" width="1.5" height="4" rx="0.75" fill="#3d62ff" />

      {/* Cabeça do Robô */}
      <rect x="3.5" y="4.5" width="17" height="15" rx="5" fill="#0d061a" stroke="url(#lumyoRobotGradient)" strokeWidth="1.5" />

      {/* Olhos Luminosos */}
      <circle cx="8.5" cy="10.5" r="2" fill="#ff2d78" />
      <circle cx="8.5" cy="10.5" r="0.8" fill="#ffffff" />

      <circle cx="15.5" cy="10.5" r="2" fill="#3d62ff" />
      <circle cx="15.5" cy="10.5" r="0.8" fill="#ffffff" />

      {/* Viseira / Boca Tecnológica */}
      <rect x="7.5" y="15" width="9" height="2" rx="1" fill="#9b24e6" />
      <line x1="9" y1="16" x2="15" y2="16" stroke="#ffffff" strokeWidth="0.6" strokeDasharray="1 1" />

      {/* Definição do Gradiente */}
      <defs>
        <linearGradient id="lumyoRobotGradient" x1="3.5" y1="4.5" x2="20.5" y2="19.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff2d78" />
          <stop offset="0.5" stopColor="#9b24e6" />
          <stop offset="1" stopColor="#3d62ff" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function isPermanentCommercialClosureCode(code) {
  return [
    'conversation_limit_reached',
    'post_qualification_limit_reached',
    'repeated_message_limit_reached',
    'abusive_message_limit_reached',
  ].includes(code);
}

export default function CommercialAgentWidget() {
  const { lang } = useLang();
  const currentLang = lang === 'en' ? 'en' : 'pt';

  const [isOpen, setIsOpen] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('idle'); // 'idle' | 'initializing' | 'ready' | 'error'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [failedMessageText, setFailedMessageText] = useState(null);
  const [requestLimitCode, setRequestLimitCode] = useState(null);
  const [requestLimitMessageText, setRequestLimitMessageText] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const triggerBtnRef = useRef(null);
  const closeBtnRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);
  const isMountedRef = useRef(true);
  const previousScrollYRef = useRef(0);
  const previousBodyOverflowRef = useRef('');
  const isRetrying401Ref = useRef(false);
  const focusReturnTimerRef = useRef(null);

  // Garantir higienizacao de estado e timers se o componente for desmontado
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (focusReturnTimerRef.current) {
        clearTimeout(focusReturnTimerRef.current);
      }
      document.body.style.overflow = previousBodyOverflowRef.current;
    };
  }, []);

  // Detecao reactiva de breakpoint mobile (<= 640px)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    setIsMobile(mql.matches);

    const handleChange = (e) => {
      if (isMountedRef.current) {
        setIsMobile(e.matches);
      }
    };

    if (mql.addEventListener) {
      mql.addEventListener('change', handleChange);
      return () => mql.removeEventListener('change', handleChange);
    } else {
      mql.addListener(handleChange);
      return () => mql.removeListener(handleChange);
    }
  }, []);

  // Bloqueio reactivo de scroll no body apenas em mobile quando aberto
  useEffect(() => {
    if (isOpen && isMobile) {
      previousScrollYRef.current = window.scrollY;
      previousBodyOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousBodyOverflowRef.current;
        window.scrollTo({ top: previousScrollYRef.current, behavior: 'auto' });
      };
    }
  }, [isOpen, isMobile]);

  // Foco inicial em mobile no botao de fechar ao abrir
  useEffect(() => {
    if (isOpen && isMobile) {
      const timer = setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMobile]);

  // Trap de foco estrito no dialogo apenas em mobile
  useEffect(() => {
    if (!isOpen || !isMobile) return;

    const isElementVisible = (el) => {
      if (!el) return false;
      if (el.disabled || el.hasAttribute('disabled')) return false;
      if (el.getAttribute('aria-hidden') === 'true') return false;
      if (el.getAttribute('tabindex') === '-1') return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    };

    const handleTabTrap = (e) => {
      if (e.key !== 'Tab' || !panelRef.current) return;

      const selector =
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const rawElements = Array.from(panelRef.current.querySelectorAll(selector));
      const focusables = rawElements.filter(isElementVisible);

      if (focusables.length === 0) return;

      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];

      if (!panelRef.current.contains(document.activeElement)) {
        e.preventDefault();
        if (e.shiftKey) {
          lastEl.focus();
        } else {
          firstEl.focus();
        }
        return;
      }

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    window.addEventListener('keydown', handleTabTrap);
    return () => window.removeEventListener('keydown', handleTabTrap);
  }, [isOpen, isMobile]);

  // Helper para repor o estado conversacional visual do widget ao iniciar sessao nova
  const resetConversationalState = useCallback(() => {
    setMessages([]);
    setFailedMessageText(null);
    setRequestLimitCode(null);
    setRequestLimitMessageText(null);
  }, []);

  // Inicializar sessao via POST /api/agent/session
  const initSession = useCallback(async () => {
    if (!isMountedRef.current) return;
    setSessionStatus('initializing');

    try {
      const res = await fetch('/api/agent/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => null);

      if (isMountedRef.current) {
        if (res.ok && data?.success) {
          if (data?.data?.resumed === false) {
            resetConversationalState();
          } else if (
            data?.data?.chatClosed === true &&
            [
              'repeated_message_limit_reached',
              'abusive_message_limit_reached',
            ].includes(data?.data?.closureCode)
          ) {
            setRequestLimitCode(data.data.closureCode);
            setRequestLimitMessageText(null);
          }
          setSessionStatus('ready');
        } else {
          setSessionStatus('error');
        }
      }
    } catch {
      if (isMountedRef.current) {
        setSessionStatus('error');
      }
    }
  }, [resetConversationalState]);

  // Controlar abertura/fecho do chat com timer limpo para retorno de foco
  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        trackClarityEvent('commercial_agent_opened');
        if (sessionStatus === 'idle' || sessionStatus === 'error') {
          initSession();
        }
      } else {
        if (focusReturnTimerRef.current) {
          clearTimeout(focusReturnTimerRef.current);
        }
        focusReturnTimerRef.current = setTimeout(() => {
          triggerBtnRef.current?.focus();
        }, 50);
      }
      return next;
    });
  }, [sessionStatus, initSession]);

  // Foco automatico no textarea apos sessao estar pronta
  useEffect(() => {
    if (
      isOpen &&
      sessionStatus === 'ready' &&
      !isPermanentCommercialClosureCode(requestLimitCode)
    ) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, sessionStatus, requestLimitCode]);

  // Auto-scroll para a ultima mensagem
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending, isOpen]);

  // Suporte à tecla Escape para fechar o widget
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleToggle]);

  // Envio de mensagem para POST /api/agent/message
  const handleSendMessage = useCallback(
    async (overrideText = null, isRetryCall = false) => {
      const textToSend = (overrideText !== null ? overrideText : input).trim();

      if (
        !textToSend ||
        textToSend.length > 2000 ||
        isSending ||
        sessionStatus !== 'ready'
      ) {
        return;
      }

      if (!isRetryCall) {
        const userMsgId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        setMessages((prev) => [
          ...prev,
          { id: userMsgId, sender: 'user', text: textToSend },
        ]);
      }

      setInput('');
      setFailedMessageText(null);
      setRequestLimitCode(null);
      setRequestLimitMessageText(null);
      setIsSending(true);

      const makeRequest = async () => {
        const res = await fetch('/api/agent/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            message: textToSend,
            language: currentLang,
          }),
        });
        const data = await res.json().catch(() => null);
        return { res, data };
      };

      try {
        let { res, data } = await makeRequest();

        if (res.status === 401 && !isRetrying401Ref.current) {
          isRetrying401Ref.current = true;
          try {
            const sessionRefreshRes = await fetch('/api/agent/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
            });
            const sessionRefreshData = await sessionRefreshRes.json().catch(() => null);

            if (sessionRefreshRes.ok && sessionRefreshData?.success) {
              const isNewSession = sessionRefreshData?.data?.resumed === false;
              if (isNewSession) {
                const userMsgId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                setMessages([
                  { id: userMsgId, sender: 'user', text: textToSend },
                ]);
                setFailedMessageText(null);
              }

              const retryObj = await makeRequest();
              res = retryObj.res;
              data = retryObj.data;
            }
          } finally {
            isRetrying401Ref.current = false;
          }
        }

        if (isMountedRef.current) {
          if (res.ok && data?.success && typeof data?.data?.reply === 'string') {
            const agentMsgId = `agent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            setMessages((prev) => [
              ...prev,
              {
                id: agentMsgId,
                sender: 'agent',
                text: data.data.reply,
                bookingAction: data.data.bookingAction || null,
              },
            ]);
            setIsSending(false);
          } else if (res.status === 429 && typeof data?.code === 'string') {
            setRequestLimitCode(data.code);
            if (
              data.code !== 'conversation_limit_reached' &&
              data.code !== 'post_qualification_limit_reached' &&
              data.code !== 'repeated_message_warning' &&
              data.code !== 'repeated_message_limit_reached' &&
              data.code !== 'abusive_message_warning' &&
              data.code !== 'abusive_message_limit_reached'
            ) {
              setRequestLimitMessageText(textToSend);
            }
            setIsSending(false);
          } else {
            setFailedMessageText(textToSend);
            setIsSending(false);
          }
        }
      } catch {
        if (isMountedRef.current) {
          setFailedMessageText(textToSend);
          setIsSending(false);
        }
      }
    },
    [input, isSending, sessionStatus, currentLang]
  );

  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const shortcuts = [
    {
      label: currentLang === 'en' ? 'Premium Websites' : 'Websites Premium',
      text:
        currentLang === 'en'
          ? 'I would like to learn more about Premium Websites.'
          : 'Gostaria de saber mais sobre Websites Premium.',
    },
    {
      label: currentLang === 'en' ? 'Automation' : 'Automação',
      text:
        currentLang === 'en'
          ? 'I would like to learn more about Automation.'
          : 'Gostaria de saber mais sobre Automação.',
    },
    {
      label: currentLang === 'en' ? 'AI Solutions' : 'Soluções de IA',
      text:
        currentLang === 'en'
          ? 'I would like to learn more about AI Solutions.'
          : 'Gostaria de saber mais sobre Soluções de IA.',
    },
    {
      label: currentLang === 'en' ? 'Digital Growth' : 'Crescimento Digital',
      text:
        currentLang === 'en'
          ? 'I would like to learn more about Digital Growth.'
          : 'Gostaria de saber mais sobre Crescimento Digital.',
    },
  ];

  return (
    <>
      {/* Botão Flutuante */}
      <button
        ref={triggerBtnRef}
        type="button"
        className="lumyo-chat-trigger-btn"
        onClick={handleToggle}
        aria-label={
          isOpen
            ? currentLang === 'en'
              ? 'Close chat'
              : 'Fechar chat'
            : currentLang === 'en'
            ? 'Open Lumyo AI assistant chat'
            : 'Abrir chat com o assistente Lumyo'
        }
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <LumyoRobotIcon size={28} />
        )}
      </button>

      {/* Painel do Chat */}
      {isOpen && (
        <div
          ref={panelRef}
          className="lumyo-chat-panel"
          data-clarity-mask="true"
          role="dialog"
          aria-modal={isMobile ? 'true' : undefined}
          aria-labelledby="lumyo-agent-title"
        >
          {/* Cabeçalho */}
          <header className="lumyo-chat-header">
            <div className="lumyo-chat-brand">
              <div className="lumyo-chat-avatar" aria-hidden="true">
                <LumyoRobotIcon size={22} />
              </div>
              <div className="lumyo-chat-title-box">
                <span id="lumyo-agent-title" className="lumyo-chat-name">
                  Lumyo
                </span>
                <span className="lumyo-chat-subtitle">
                  {currentLang === 'en' ? 'AI Assistant' : 'Assistente de IA'}
                </span>
              </div>
            </div>

            <button
              ref={closeBtnRef}
              type="button"
              className="lumyo-chat-close-btn"
              onClick={handleToggle}
              aria-label={currentLang === 'en' ? 'Close chat' : 'Fechar chat'}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </header>

          {/* Área de Mensagens */}
          <div className="lumyo-chat-messages-area" aria-live="polite">
            {sessionStatus === 'initializing' && (
              <div className="lumyo-chat-empty-state">
                <p className="lumyo-chat-subtitle">
                  {currentLang === 'en'
                    ? 'Connecting...'
                    : 'A estabelecer ligação...'}
                </p>
              </div>
            )}

            {sessionStatus === 'error' && (
              <div className="lumyo-chat-empty-state">
                <p className="lumyo-chat-empty-title">
                  {currentLang === 'en'
                    ? 'Unable to start chat'
                    : 'Não foi possível iniciar o chat'}
                </p>
                <button
                  type="button"
                  className="lumyo-chat-retry-btn"
                  onClick={initSession}
                >
                  {currentLang === 'en' ? 'Try again' : 'Tentar novamente'}
                </button>
              </div>
            )}

            {sessionStatus === 'ready' &&
              messages.length === 0 &&
              !isPermanentCommercialClosureCode(requestLimitCode) && (
              <div className="lumyo-chat-empty-state">
                <h2 className="lumyo-chat-empty-title">
                  {currentLang === 'en'
                    ? 'How can I help?'
                    : 'Como posso ajudar?'}
                </h2>
                <div className="lumyo-chat-shortcuts-grid">
                  {shortcuts.map((sc, i) => (
                    <button
                      key={i}
                      type="button"
                      className="lumyo-chat-shortcut-btn"
                      onClick={() => handleSendMessage(sc.text)}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`lumyo-chat-msg-row ${m.sender}`}>
                <div className="lumyo-chat-bubble-container">
                  <div className="lumyo-chat-bubble">{m.text}</div>
                  {m.bookingAction &&
                    m.bookingAction.type === 'calcom' &&
                    typeof m.bookingAction.url === 'string' &&
                    m.bookingAction.url.startsWith('https://cal.com/') && (
                      <a
                        href={m.bookingAction.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lumyo-chat-booking-btn"
                        onClick={() => trackClarityEvent('diagnostic_booking_clicked')}
                      >
                        <span>
                          {m.bookingAction.label ||
                            (currentLang === 'en' ? 'Choose a time' : 'Escolher horário')}
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </a>
                    )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="lumyo-chat-msg-row agent">
                <div
                  className="lumyo-chat-typing-indicator"
                  aria-label={currentLang === 'en' ? 'Generating response' : 'A gerar resposta'}
                >
                  <div className="lumyo-chat-typing-dot" />
                  <div className="lumyo-chat-typing-dot" />
                  <div className="lumyo-chat-typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Rodapé / Área de Input */}
          <footer className="lumyo-chat-footer">
            {requestLimitCode && !isSending && (
              <div className="lumyo-chat-error-banner" role="status">
                <span>
                  {requestLimitCode === 'post_qualification_limit_reached'
                    ? currentLang === 'en'
                      ? 'You have reached the limit for this chat. To clarify additional questions, book a diagnostic meeting using the “Choose a time” button.'
                      : 'Atingiste o limite deste chat. Para esclarecer questões adicionais, agenda uma reunião de diagnóstico através do botão «Escolher horário».'
                    : requestLimitCode === 'repeated_message_limit_reached'
                    ? currentLang === 'en'
                      ? 'This chat was closed after repeated messages. To continue, please contact the Lumyo team directly.'
                      : 'Este chat foi encerrado após o envio repetido da mesma mensagem. Para continuar, contacta diretamente a equipa Lumyo.'
                    : requestLimitCode === 'repeated_message_warning'
                    ? currentLang === 'en'
                      ? 'We have already received this message. Please rephrase it or provide different information to continue.'
                      : 'Já recebemos esta mensagem. Reformula-a ou acrescenta informação diferente para continuar.'
                    : requestLimitCode === 'abusive_message_limit_reached'
                    ? currentLang === 'en'
                      ? 'This chat was closed due to abusive language. To continue, please contact the Lumyo team directly.'
                      : 'Este chat foi encerrado devido a linguagem abusiva. Para continuar, contacta diretamente a equipa Lumyo.'
                    : requestLimitCode === 'abusive_message_warning'
                    ? currentLang === 'en'
                      ? 'Please keep the conversation respectful. You can continue by sending a business-related message.'
                      : 'Mantém uma linguagem respeitosa. Para continuares, envia uma mensagem relacionada com o teu projeto.'
                    : requestLimitCode === 'conversation_limit_reached'
                    ? currentLang === 'en'
                      ? 'This conversation has reached its message limit. Please contact us directly to continue.'
                      : 'Esta conversa atingiu o limite de mensagens. Contacta-nos diretamente para continuar.'
                    : currentLang === 'en'
                    ? 'Too many messages in a short time. Please wait one minute and try again.'
                    : 'Foram enviadas demasiadas mensagens num curto período. Aguarda um minuto e tenta novamente.'}
                </span>
                {requestLimitCode !== 'conversation_limit_reached' &&
                  requestLimitCode !== 'post_qualification_limit_reached' &&
                  requestLimitCode !== 'repeated_message_warning' &&
                  requestLimitCode !== 'repeated_message_limit_reached' &&
                  requestLimitCode !== 'abusive_message_warning' &&
                  requestLimitCode !== 'abusive_message_limit_reached' &&
                  requestLimitMessageText && (
                    <button
                      type="button"
                      className="lumyo-chat-retry-btn"
                      onClick={() =>
                        handleSendMessage(requestLimitMessageText, true)
                      }
                    >
                      {currentLang === 'en' ? 'Try again' : 'Tentar novamente'}
                    </button>
                  )}
              </div>
            )}

            <form
              className="lumyo-chat-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <textarea
                ref={textareaRef}
                className="lumyo-chat-textarea"
                rows="1"
                maxLength={2000}
                placeholder={
                  currentLang === 'en'
                    ? 'Type a message...'
                    : 'Escreve uma mensagem...'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                disabled={
                  sessionStatus !== 'ready' ||
                  isSending ||
                  isPermanentCommercialClosureCode(requestLimitCode)
                }
                aria-label={
                  currentLang === 'en'
                    ? 'Type your message'
                    : 'Escreve a tua mensagem'
                }
              />
              <button
                type="submit"
                className="lumyo-chat-send-btn"
                disabled={
                  !input.trim() ||
                  input.trim().length > 2000 ||
                  sessionStatus !== 'ready' ||
                  isSending ||
                  isPermanentCommercialClosureCode(requestLimitCode)
                }
                aria-label={
                  currentLang === 'en' ? 'Send message' : 'Enviar mensagem'
                }
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>

            {failedMessageText && !isSending && (
              <div className="lumyo-chat-error-banner">
                <span>
                  {currentLang === 'en'
                    ? 'Could not send message.'
                    : 'Não foi possível enviar a mensagem.'}
                </span>
                <button
                  type="button"
                  className="lumyo-chat-retry-btn"
                  onClick={() => handleSendMessage(failedMessageText, true)}
                >
                  {currentLang === 'en' ? 'Try again' : 'Tentar novamente'}
                </button>
              </div>
            )}
          </footer>
        </div>
      )}
    </>
  );
}
