import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { Sparkles, Send, Bot, User, RefreshCw, Layers, ArrowLeftRight, Flame, HelpCircle } from "lucide-react";

const QUICK_QUESTIONS = [
  "🧀 Где попробовать настоящий адыгейский сыр?",
  "🚗 За сколько дней можно осмотреть главные места?",
  "🥾 Что взять с собой для похода в горы?",
  "👨‍👩‍👧‍👦 Какие достопримечательности подойдут для детей?",
];

export default function AiTouristGuide() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      text: "Салам! 🌲 Я ваш личный ИИ-экскурсовод по Республике Адыгея. Я знаю всё о величественных водопадах, вершинах Лаго-Наки, кавказской кухне и секретных туристических тропах.\n\nЗадайте мне любой вопрос о путешествии в Адыгею!",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;
    
    setErrorStatus(null);
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Map previous messages to prompt history structure
      const history = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      const res = await fetch("/api/ai-guide", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: textToSend,
          history
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Не удалось получить ответ от ИИ.");
      }

      const data = await res.json();
      
      const modelMsg: ChatMessage = {
        id: `msg-${Date.now()}-model`,
        role: "model",
        text: data.text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      console.error("AI Guide error:", err);
      setErrorStatus(err.message || "Ошибка подключения к серверу. Убедитесь, что сервер запущен.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome",
        role: "model",
        text: "Салам! 🌲 Я ваш личный ИИ-экскурсовод по Республике Адыгея. Я знаю всё о величественных водопадах, вершинах Лаго-Наки, кавказской кухне и секретных туристических тропах.\n\nЗадайте мне любой вопрос о путешествии в Адыгею!",
        timestamp: new Date(),
      },
    ]);
    setErrorStatus(null);
  };

  return (
    <div id="ai_guide_panel_wrapper" className="bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 text-white rounded-3xl p-6 border border-emerald-900/30 shadow-2xl flex flex-col h-[520px] relative overflow-hidden">
      
      {/* Glow decorative effects */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Panel title */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base md:text-lg tracking-tight">ИИ-Путеводитель</h3>
            <p className="text-[11px] text-teal-300 font-mono tracking-wide uppercase">Спросите нейросеть о Кавказе</p>
          </div>
        </div>
        
        <button 
          onClick={handleReset}
          className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-white/75 transition hover:text-white"
          title="Сбросить историю диалога"
          id="btn_reset_ai_chat"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-white/10 z-10 min-h-0">
        {messages.map((msg) => {
          const isModel = msg.role === "model";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 max-w-[90%] ${isModel ? "" : "ml-auto flex-row-reverse"}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border mt-1 ${
                isModel 
                  ? "bg-teal-900 border-teal-800 text-teal-300" 
                  : "bg-emerald-600 border-emerald-500 text-white"
              }`}>
                {isModel ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm whitespace-pre-line leading-relaxed ${
                isModel 
                  ? "bg-white/10 text-white border border-white/5" 
                  : "bg-gradient-to-r from-emerald-600 to-teal-700 text-white"
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex items-start gap-2.5 max-w-[90%]">
            <div className="w-7 h-7 rounded-lg bg-teal-900 border border-teal-800 text-teal-300 flex items-center justify-center mt-1">
              <Bot className="w-4 h-4 animate-spin-slow" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-white/10 text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              <span className="text-xs font-mono text-teal-400/80 ml-1">Формирую ответ гида...</span>
            </div>
          </div>
        )}

        {/* Error Notice */}
        {errorStatus && (
          <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl text-red-300 text-xs">
            <p className="font-semibold">⚠️ Внимание:</p>
            <p className="mt-1">{errorStatus}</p>
            <button 
              onClick={() => handleSendMessage(inputValue || "Расскажи про Адыгейский сыр")} 
              className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 mt-2 block"
            >
              Попробовать снова
            </button>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Quick Questions */}
      {messages.length < 3 && (
        <div className="mt-4 z-10 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-teal-400 font-semibold mb-2 uppercase tracking-wide">
            <HelpCircle className="w-3.5 h-3.5" /> Быстрые вопросы:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.replace(/^[^\s]+\s/, ""))}
                className="text-left text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl text-slate-200 hover:text-white transition duration-200"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inputs panel */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputValue);
        }}
        className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4 z-10 shrink-0"
        id="ai_chat_form"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Спросите меня: «Куда пойти на выходных?» или..."
          className="flex-grow bg-white/10 border border-white/10 placeholder-slate-400 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 hover:bg-white/[0.12]"
          id="ai_chat_input_field"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white p-2.5 rounded-xl disabled:opacity-40 disabled:hover:scale-100 transition shadow-lg hover:shadow-teal-500/20 active:scale-95"
          id="ai_chat_send_button"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
