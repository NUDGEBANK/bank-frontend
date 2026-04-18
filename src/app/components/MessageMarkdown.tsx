import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "./ui/utils";

type MessageMarkdownProps = {
  content: string;
  className?: string;
  invert?: boolean;
  onAskClick?: (message: string) => void;
  onNavigateClick?: (href: string) => void;
  disabledLinks?: boolean;
};

export default function MessageMarkdown({
  content,
  className,
  invert = false,
  onAskClick,
  onNavigateClick,
  disabledLinks = false,
}: MessageMarkdownProps) {
  return (
    <div
      className={cn(
        "message-markdown text-sm leading-7",
        invert ? "text-inherit" : "text-slate-800",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-3 text-base font-bold first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-3 text-[15px] font-bold first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3 text-sm font-semibold first:mt-0">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mt-3 whitespace-pre-wrap first:mt-0">{children}</p>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className={cn(
                "mt-3 border-l-2 pl-3 first:mt-0",
                invert
                  ? "border-white/40 text-white/90"
                  : "border-slate-300 text-slate-600",
              )}
            >
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="mt-3 list-disc space-y-2 pl-5 first:mt-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-3 list-decimal space-y-2 pl-5 first:mt-0">{children}</ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          a: ({ href, children }) => {
            const linkHref = href ?? "";
            const isAskLink = linkHref.startsWith("#ask=");
            const isInternalLink = linkHref.startsWith("/");
            const isExternalLink =
              linkHref.startsWith("http://") || linkHref.startsWith("https://");

            return (
              <a
                href={linkHref}
                target={isExternalLink ? "_blank" : undefined}
                rel={isExternalLink ? "noreferrer" : undefined}
                className={cn(
                  "font-medium underline underline-offset-4",
                  disabledLinks ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                )}
                onClick={(event) => {
                  if (disabledLinks) {
                    event.preventDefault();
                    return;
                  }

                  if (isAskLink) {
                    event.preventDefault();

                    const encodedMessage = linkHref.slice("#ask=".length);
                    let message = encodedMessage.trim();

                    try {
                      message = decodeURIComponent(encodedMessage).trim();
                    } catch {
                      message = encodedMessage.trim();
                    }

                    if (message) {
                      onAskClick?.(message);
                    }

                    return;
                  }

                  if (isInternalLink) {
                    event.preventDefault();
                    onNavigateClick?.(linkHref);
                  }
                }}
              >
                {children}
              </a>
            );
          },
          table: ({ children }) => (
            <div className="mt-3 overflow-x-auto first:mt-0">
              <table className="min-w-full border-collapse overflow-hidden rounded-2xl border border-slate-200 text-left text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={invert ? "bg-white/10" : "bg-slate-50"}>{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className={invert ? "border-white/10" : "border-slate-200"}>{children}</tr>
          ),
          th: ({ children }) => (
            <th className="border border-inherit px-3 py-2 font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-inherit px-3 py-2 align-top">{children}</td>
          ),
          code: ({ className: codeClassName, children, ...props }: any) => {
            const isInline = !String(codeClassName ?? "").includes("language-");

            if (isInline) {
              return (
                <code
                  className="rounded bg-black/10 px-1.5 py-0.5 text-[0.95em]"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <code className={codeClassName} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre
              className={cn(
                "mt-3 overflow-x-auto rounded-2xl px-4 py-3 text-xs leading-6 first:mt-0",
                invert ? "bg-white/10 text-white" : "bg-slate-900 text-slate-50",
              )}
            >
              {children}
            </pre>
          ),
          hr: () => (
            <hr
              className={cn(
                "mt-4 border-t first:mt-0",
                invert ? "border-white/20" : "border-slate-200",
              )}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
