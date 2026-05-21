import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders post bodies (Markdown) with the Majorille type system.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="serif text-3xl lg:text-4xl text-deep-brown leading-tight mt-12">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="serif text-2xl text-deep-brown leading-snug mt-8">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-lg text-muted leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-6 space-y-2 text-lg text-muted">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 space-y-2 text-lg text-muted">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className="text-deep-brown font-semibold">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-terracotta pl-5 italic serif text-2xl text-deep-brown">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-terracotta underline underline-offset-2 hover:text-terracotta-dark"
            >
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
