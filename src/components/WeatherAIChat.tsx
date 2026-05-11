"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface WeatherAIChatProps {
  currentCity: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatApiResponse {
  reply?: string;
  error?: string;
}

export function WeatherAIChat({ currentCity }: WeatherAIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      role: "assistant",
      content: `¡Hola! Soy tu IA del clima para ${currentCity}.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((prev) => {
      const onlyWelcome =
        prev.length === 1 &&
        prev[0].role === "assistant" &&
        prev[0].content.startsWith("¡Hola! Soy tu IA del clima para ");

      if (onlyWelcome) {
        return [
          {
            role: "assistant",
            content: `¡Hola! Soy tu IA del clima para ${currentCity}.`,
          },
        ];
      }

      return prev;
    });
  }, [currentCity]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleToggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSend = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isLoading) {
      return;
    }

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    void (async () => {
      try {
        const res = await fetch("/api/weather-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: userMsg, currentCity }),
        });

        const data: ChatApiResponse = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "No se pudo generar la respuesta.");
        }

        const reply = data.reply?.trim();
        if (!reply) {
          throw new Error("No se recibio una respuesta valida.");
        }

        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch (error) {
        const fallbackMessage =
          error instanceof Error ? error.message : "Error de conexión.";

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fallbackMessage },
        ]);
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <motion.div className="pointer-events-auto fixed bottom-4 right-4 z-50 sm:bottom-5 sm:right-5">
        <motion.button
          onClick={handleToggleChat}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="bg-slate-900 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center font-bold text-lg border-2 border-white/20 focus:outline-none"
        >
          {isOpen ? "✕" : "AI"}
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute bottom-full mb-4 right-0 w-80 h-[450px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
            >
              <div className="bg-slate-900 p-4 text-white">
                <h3 className="text-sm font-bold">Asistente de Clima</h3>
                <p className="text-[10px] opacity-70">Ciudad: {currentCity}</p>
              </div>

              <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3">
                {messages.map((m, i) => (
                  <motion.div
                    key={`${m.role}-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      m.role === "user"
                        ? "bg-slate-900 text-white ml-auto rounded-tr-none"
                        : "bg-white text-slate-800 border rounded-tl-none shadow-sm"
                    }`}
                  >
                    {m.content}
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="text-xs text-slate-400 animate-pulse">
                    Escribiendo...
                  </div>
                )}
                <div ref={scrollRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="p-3 bg-white border-t flex gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="¿Lloverá hoy?"
                  className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                />
                <button
                  type="submit"
                  className="bg-slate-900 text-white p-2 rounded-full hover:scale-105 transition"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
