"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  /** "article" uses larger headline sizes for full editorial pages */
  variant?: "default" | "article";
}

export default function MarkdownRenderer({
  content,
  variant = "default",
}: MarkdownRendererProps) {
  const h2Class =
    variant === "article"
      ? "font-display text-2xl font-bold text-text-primary mt-10 mb-4 first:mt-0"
      : "font-display text-lg font-bold text-text-primary mt-7 mb-2 first:mt-0";

  const h3Class =
    variant === "article"
      ? "font-display text-xl font-semibold text-text-primary mt-7 mb-3"
      : "font-display text-base font-semibold text-text-primary mt-5 mb-2";

  const components: Components = {
    h1: ({ children }) => (
      <h1 className="font-display text-3xl font-extrabold text-text-primary mt-0 mb-4">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className={h2Class}>{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className={h3Class}>{children}</h3>
    ),
    p: ({ children }) => (
      <p className="text-text-secondary text-[15px] leading-[1.85] mb-5">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="space-y-2 mb-5 pl-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="space-y-3 mb-5 counter-reset-list pl-1">{children}</ol>
    ),
    li: ({ children, ...props }) => {
      const isOrdered = (props as { ordered?: boolean }).ordered;
      if (isOrdered) {
        return (
          <li className="flex items-start gap-3 text-text-secondary text-[15px] leading-[1.8]">
            <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-accent-primary/15 border border-accent-primary/25 flex items-center justify-center font-mono text-xs font-bold text-accent-primary">
              {(props as { index?: number }).index != null
                ? ((props as { index?: number }).index ?? 0) + 1
                : "•"}
            </span>
            <span>{children}</span>
          </li>
        );
      }
      return (
        <li className="flex items-start gap-2.5 text-text-secondary text-[15px] leading-[1.8]">
          <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0" />
          <span>{children}</span>
        </li>
      );
    },
    blockquote: ({ children }) => (
      <div className="my-6 pl-5 pr-4 py-4 border-l-4 border-accent-primary bg-accent-primary/5 rounded-r-xl">
        <div className="text-text-primary text-[15px] leading-relaxed [&>p]:mb-0 [&>p]:text-text-primary [&>p]:italic font-medium">
          {children}
        </div>
      </div>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-text-primary">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic text-text-secondary/80">{children}</em>
    ),
    code: ({ children, className }) => {
      const isBlock = className?.startsWith("language-");
      if (isBlock) {
        return (
          <pre className="my-5 p-4 rounded-xl bg-bg-secondary border border-border overflow-x-auto">
            <code className="font-mono text-sm text-accent-primary leading-relaxed">
              {children}
            </code>
          </pre>
        );
      }
      return (
        <code className="font-mono text-xs bg-bg-secondary border border-border px-1.5 py-0.5 rounded text-accent-primary">
          {children}
        </code>
      );
    },
    hr: () => <hr className="my-8 border-border" />,
    a: ({ href, children }) => (
      <a
        href={href}
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel="noopener noreferrer"
        className="text-accent-primary underline underline-offset-2 decoration-accent-primary/30 hover:decoration-accent-primary transition-colors"
      >
        {children}
      </a>
    ),
  };

  return (
    <div className="leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
