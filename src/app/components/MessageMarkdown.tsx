import type { ReactNode } from "react";

import { cn } from "./ui/utils";

type MessageMarkdownProps = {
  content: string;
  className?: string;
  invert?: boolean;
};

type ListBlock = {
  type: "ul" | "ol";
  items: string[];
};

type Block =
  | { type: "heading"; level: 1 | 2 | 3; content: string }
  | { type: "blockquote"; content: string }
  | { type: "code"; content: string }
  | { type: "paragraph"; content: string }
  | ListBlock;

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];

  let index = 0;
  while (index < lines.length) {
    const trimmed = lines[index].trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push({ type: "code", content: codeLines.join("\n") });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        content: headingMatch[2],
      });
      index += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (index < lines.length) {
        const current = lines[index].trim();
        if (!current.startsWith(">")) {
          break;
        }
        quoteLines.push(current.replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "blockquote", content: quoteLines.join("\n") });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length) {
        const match = lines[index].trim().match(/^[-*]\s+(.+)$/);
        if (!match) {
          break;
        }
        items.push(match[1]);
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length) {
        const match = lines[index].trim().match(/^\d+\.\s+(.+)$/);
        if (!match) {
          break;
        }
        items.push(match[1]);
        index += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const current = lines[index];
      const currentTrimmed = current.trim();

      if (!currentTrimmed) {
        break;
      }

      if (
        currentTrimmed.startsWith("```") ||
        currentTrimmed.startsWith(">") ||
        /^#{1,3}\s+/.test(currentTrimmed) ||
        /^[-*]\s+/.test(currentTrimmed) ||
        /^\d+\.\s+/.test(currentTrimmed)
      ) {
        break;
      }

      paragraphLines.push(current);
      index += 1;
    }

    blocks.push({ type: "paragraph", content: paragraphLines.join("\n") });
  }

  return blocks;
}

function parseInline(content: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(\[[^\]]+\]\((https?:\/\/[^\s)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      const linkMatch = match[1].match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      const label = linkMatch?.[1] ?? match[2];
      nodes.push(
        <a
          key={`${match.index}-link`}
          href={match[2]}
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-4"
        >
          {label}
        </a>,
      );
    } else if (match[3]) {
      nodes.push(<strong key={`${match.index}-strong`}>{match[4]}</strong>);
    } else if (match[5]) {
      nodes.push(<em key={`${match.index}-em`}>{match[6]}</em>);
    } else if (match[7]) {
      nodes.push(
        <code
          key={`${match.index}-code`}
          className="rounded bg-black/10 px-1.5 py-0.5 text-[0.95em]"
        >
          {match[8]}
        </code>,
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex));
  }

  return nodes;
}

function renderWithLineBreaks(content: string): ReactNode[] {
  return content.split("\n").flatMap((line, index, array) => {
    const lineNodes = parseInline(line);
    if (index === array.length - 1) {
      return lineNodes;
    }
    return [...lineNodes, <br key={`br-${index}`} />];
  });
}

export default function MessageMarkdown({
  content,
  className,
  invert = false,
}: MessageMarkdownProps) {
  const blocks = parseBlocks(content);

  return (
    <div
      className={cn(
        "message-markdown text-sm leading-7",
        invert ? "text-inherit" : "text-slate-800",
        className,
      )}
    >
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === "heading") {
          const headingClass =
            block.level === 1
              ? "text-base font-bold"
              : block.level === 2
                ? "text-[15px] font-bold"
                : "text-sm font-semibold";

          return (
            <div key={key} className={cn("mt-3 first:mt-0", headingClass)}>
              {renderWithLineBreaks(block.content)}
            </div>
          );
        }

        if (block.type === "blockquote") {
          return (
            <blockquote
              key={key}
              className={cn(
                "mt-3 border-l-2 pl-3 first:mt-0",
                invert ? "border-white/40 text-white/90" : "border-slate-300 text-slate-600",
              )}
            >
              {renderWithLineBreaks(block.content)}
            </blockquote>
          );
        }

        if (block.type === "code") {
          return (
            <pre
              key={key}
              className={cn(
                "mt-3 overflow-x-auto rounded-2xl px-4 py-3 text-xs leading-6 first:mt-0",
                invert
                  ? "bg-white/10 text-white"
                  : "bg-slate-900 text-slate-50",
              )}
            >
              <code>{block.content}</code>
            </pre>
          );
        }

        if (block.type === "ul" || block.type === "ol") {
          const ListTag = block.type;
          return (
            <ListTag
              key={key}
              className={cn(
                "mt-3 space-y-1 pl-5 first:mt-0",
                block.type === "ul" ? "list-disc" : "list-decimal",
              )}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>{renderWithLineBreaks(item)}</li>
              ))}
            </ListTag>
          );
        }

        return (
          <p key={key} className="mt-3 first:mt-0">
            {renderWithLineBreaks(block.content)}
          </p>
        );
      })}
    </div>
  );
}
