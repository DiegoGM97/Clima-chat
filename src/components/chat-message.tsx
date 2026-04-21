import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/use-realtime-chat";

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showHeader: boolean;
}

export const ChatMessageItem = ({
  message,
  isOwnMessage,
  showHeader,
}: ChatMessageItemProps) => {
  return (
    <div
      className={`flex mt-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={cn("max-w-[75%] w-fit flex flex-col gap-1", {
          "items-end": isOwnMessage,
        })}
      >
        {showHeader && (
          <div
            className={cn("flex items-center gap-2 text-xs px-3", {
              "justify-end flex-row-reverse": isOwnMessage,
            })}
          >
            <span className={"font-medium"}>{message.user.name}</span>
            <span className="text-foreground/50 text-xs">
              {new Date(message.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        )}
        <div
          className={cn(
            "py-2 px-3 rounded-xl text-sm w-fit",
            isOwnMessage
              ? "bg-sky-600 text-white"
              : "bg-slate-100 text-slate-900",
          )}
        >
          {message.content ? <p>{message.content}</p> : null}
          {message.imageUrl ? (
            <img
              src={message.imageUrl}
              alt="Foto compartida en el chat"
              className="mt-2 max-h-64 w-full rounded-lg object-cover"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
