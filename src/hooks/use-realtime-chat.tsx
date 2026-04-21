"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/client";

interface UseRealtimeChatProps {
  roomName: string;
  username: string;
  userId: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  imageUrl: string | null;
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
}

const CHAT_BUCKET = "climate-chat-images";
const MESSAGE_EVENT = "message";
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface ChatRoomRecord {
  id: string;
  slug: string;
}

interface ChatMessageRecord {
  id: string;
  content: string | null;
  image_url: string | null;
  user_id: string;
  username: string;
  created_at: string;
}

function mapMessage(record: ChatMessageRecord): ChatMessage {
  return {
    id: record.id,
    content: record.content ?? "",
    imageUrl: record.image_url,
    user: {
      id: record.user_id,
      name: record.username,
    },
    createdAt: record.created_at,
  };
}

export function useRealtimeChat({
  roomName,
  username,
  userId,
}: UseRealtimeChatProps) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channel, setChannel] = useState<ReturnType<
    typeof supabase.channel
  > | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const ensureRoom = useCallback(async () => {
    const { data: existingRoom, error: existingError } = await supabase
      .from("chat_rooms")
      .select("id, slug")
      .eq("slug", roomName)
      .maybeSingle<ChatRoomRecord>();

    if (existingError) {
      throw existingError;
    }

    if (existingRoom) {
      return existingRoom;
    }

    const { data: insertedRoom, error: insertError } = await supabase
      .from("chat_rooms")
      .insert({ slug: roomName })
      .select("id, slug")
      .single<ChatRoomRecord>();

    if (insertError) {
      throw insertError;
    }

    return insertedRoom;
  }, [roomName, supabase]);

  const loadMessages = useCallback(
    async (targetRoomId: string) => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, content, image_url, user_id, username, created_at")
        .eq("room_id", targetRoomId)
        .order("created_at", { ascending: true })
        .limit(150)
        .returns<ChatMessageRecord[]>();

      if (error) {
        throw error;
      }

      setMessages((data ?? []).map(mapMessage));
    },
    [supabase],
  );

  useEffect(() => {
    setMessages([]);
    setConnectedUsers([]);
    setRoomId(null);

    let isActive = true;
    let activeChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeRoom = async () => {
      try {
        const room = await ensureRoom();
        if (!isActive) return;

        setRoomId(room.id);
        await loadMessages(room.id);

        const newChannel = supabase.channel(`presence-${room.slug}`);
        activeChannel = newChannel;

        newChannel
          .on("broadcast", { event: MESSAGE_EVENT }, (payload) => {
            const incoming = payload.payload as ChatMessage;

            setMessages((current) => {
              if (current.some((item) => item.id === incoming.id)) {
                return current;
              }

              return [...current, incoming];
            });
          })
          .on("presence", { event: "sync" }, () => {
            const state = newChannel.presenceState();
            const users = new Set<string>();

            Object.values(state).forEach((presences) => {
              const presenceList = Array.isArray(presences) ? presences : [];
              presenceList.forEach((presence) => {
                if (
                  presence &&
                  typeof presence === "object" &&
                  "name" in presence &&
                  typeof (presence as { name: unknown }).name === "string"
                ) {
                  users.add((presence as { name: string }).name);
                }
              });
            });

            setConnectedUsers(
              Array.from(users).sort((a, b) => a.localeCompare(b)),
            );
          })
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "chat_messages",
              filter: `room_id=eq.${room.id}`,
            },
            (payload) => {
              const nextMessage = mapMessage(payload.new as ChatMessageRecord);

              setMessages((current) => {
                if (current.some((item) => item.id === nextMessage.id)) {
                  return current;
                }

                return [...current, nextMessage];
              });
            },
          )
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
              setIsConnected(true);
              await newChannel.track({
                name: username,
                user_id: userId,
                online_at: new Date().toISOString(),
              });
            } else {
              setIsConnected(false);
              setConnectedUsers([]);
            }
          });

        if (!isActive) {
          supabase.removeChannel(newChannel);
          return;
        }

        setChannel(newChannel);
      } catch {
        setIsConnected(false);
        setConnectedUsers([]);
        setChatError("No se pudo conectar al chat en tiempo real");
      }
    };

    void setupRealtimeRoom();

    return () => {
      isActive = false;
      setMessages([]);
      setConnectedUsers([]);
      setRoomId(null);
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, [roomName, username, userId, supabase, ensureRoom, loadMessages]);

  const sendMessage = useCallback(
    async (content: string, file?: File | null) => {
      if (!channel || !isConnected || !roomId) return;
      setChatError(null);

      const trimmed = content.trim();
      if (!trimmed && !file) return;

      let imageUrl: string | null = null;

      if (file) {
        if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
          setChatError("Formato de imagen no valido. Usa JPG, PNG o WEBP.");
          return;
        }

        if (file.size > MAX_IMAGE_SIZE_BYTES) {
          setChatError(`La imagen supera ${MAX_IMAGE_SIZE_MB} MB.`);
          return;
        }

        setIsUploading(true);
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${roomName}/${userId}/${crypto.randomUUID()}.${ext}`;

        try {
          const { error: uploadError } = await supabase.storage
            .from(CHAT_BUCKET)
            .upload(path, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            setChatError("No se pudo subir la imagen. Intenta nuevamente.");
            throw uploadError;
          }

          const { data } = supabase.storage
            .from(CHAT_BUCKET)
            .getPublicUrl(path);
          imageUrl = data.publicUrl;
        } finally {
          setIsUploading(false);
        }
      }

      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          room_id: roomId,
          user_id: userId,
          username,
          content: trimmed || null,
          image_url: imageUrl,
        })
        .select("id, content, image_url, user_id, username, created_at")
        .single<ChatMessageRecord>();

      if (error) {
        setChatError("No se pudo enviar el mensaje. Intenta nuevamente.");
        throw error;
      }

      if (data) {
        const nextMessage = mapMessage(data);
        setMessages((current) => {
          if (current.some((item) => item.id === nextMessage.id)) {
            return current;
          }

          return [...current, nextMessage];
        });

        // Push immediately to connected clients in the same room.
        await channel.send({
          type: "broadcast",
          event: MESSAGE_EVENT,
          payload: nextMessage,
        });
      }
    },
    [channel, isConnected, roomId, roomName, supabase, userId, username],
  );

  return {
    messages,
    sendMessage,
    isConnected,
    connectedUsers,
    isUploading,
    chatError,
  };
}
