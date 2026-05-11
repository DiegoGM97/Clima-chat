"use client";

import { ImagePlus, Send, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { ChatMessageItem } from "@/components/chat-message";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useRealtimeChat } from "@/hooks/use-realtime-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RealtimeChatProps {
  roomName: string;
  roomLabel?: string;
  username: string;
  userId: string;
}

export const RealtimeChat = ({
  roomName,
  roomLabel,
  username,
  userId,
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll();

  const {
    messages,
    sendMessage,
    isConnected,
    connectedUsers,
    isUploading,
    chatError,
  } = useRealtimeChat({
    roomName,
    username,
    userId,
  });
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const previewUrl = useMemo(() => {
    return selectedFile ? URL.createObjectURL(selectedFile) : null;
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages],
  );

  useEffect(() => {
    scrollToBottom();
  }, [sortedMessages, scrollToBottom]);

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (
        (!newMessage.trim() && !selectedFile) ||
        !isConnected ||
        isUploading
      ) {
        return;
      }

      void sendMessage(newMessage, selectedFile);
      setNewMessage("");
      setSelectedFile(null);
    },
    [newMessage, selectedFile, isConnected, isUploading, sendMessage],
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-blue-500 text-slate-900 antialiased">
      <div className="border-b border-slate-200 bg-slate-100/80 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">
            Chat en tiempo real
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <span
              className={cn(
                "inline-block h-2.5 w-2.5 rounded-full",
                isConnected ? "bg-emerald-500" : "bg-slate-400",
              )}
              aria-hidden="true"
            />
            {isConnected ? "Conectado" : "Conectando..."}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-600">
          Sala actual: {roomLabel ?? roomName}
        </p>
        <p className="mt-2 text-xs text-slate-600">
          En linea ({connectedUsers.length}):{" "}
          {connectedUsers.length > 0
            ? connectedUsers.join(", ")
            : "sin usuarios"}
        </p>
      </div>

      <div
        ref={containerRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/90 p-4"
      >
        {!isConnected ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-center text-sm text-slate-500">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-slate-400" />
            Conectando a la sala...
          </div>
        ) : null}

        {isConnected && sortedMessages.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-center text-sm text-slate-600">
            Aun no hay mensajes. Escribe el primero para iniciar la
            conversacion.
          </div>
        ) : null}
        <div className="space-y-1">
          {sortedMessages.map((message, index) => {
            const prevMessage = index > 0 ? sortedMessages[index - 1] : null;
            const showHeader =
              !prevMessage || prevMessage.user.name !== message.user.name;

            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                <ChatMessageItem
                  message={message}
                  isOwnMessage={message.user.name === username}
                  showHeader={showHeader}
                />
              </div>
            );
          })}
        </div>
      </div>

      <form
        onSubmit={handleSendMessage}
        className="flex w-full gap-2 border-t border-slate-200 bg-slate-100/70 p-4"
      >
        <label className="flex cursor-pointer items-center justify-center rounded-full border border-slate-300 px-3 text-slate-500 hover:bg-slate-200/70">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const nextFile = e.target.files?.[0] ?? null;
              setSelectedFile(nextFile);
            }}
            disabled={!isConnected || isUploading}
          />
          <ImagePlus className="size-4" />
        </label>
        <Input
          className={cn(
            "rounded-full border-slate-300 bg-white text-sm transition-all duration-300",
            isConnected && newMessage.trim() ? "w-[calc(100%-36px)]" : "w-full",
          )}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          disabled={!isConnected || isUploading}
        />
        {isConnected && (newMessage.trim() || selectedFile) && (
          <Button
            className="aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300"
            type="submit"
            disabled={!isConnected || isUploading}
          >
            <Send className="size-4" />
          </Button>
        )}
      </form>
      {selectedFile && previewUrl ? (
        <div className="px-4 pt-2 pb-3">
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-sky-50/70 p-2">
            <img
              src={previewUrl}
              alt="Vista previa antes de enviar"
              className="h-14 w-14 rounded-md object-cover"
            />
            <div className="max-w-40">
              <p className="truncate text-xs text-slate-900">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-slate-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="rounded-full border border-slate-300 p-1 text-slate-500 hover:bg-white"
              aria-label="Quitar imagen"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      ) : null}
      {isUploading ? (
        <p className="px-4 pb-3 text-xs text-slate-600">Subiendo imagen...</p>
      ) : null}
      {chatError ? (
        <p className="px-4 pb-3 text-xs text-red-500">Error: {chatError}</p>
      ) : null}
    </div>
  );
};
