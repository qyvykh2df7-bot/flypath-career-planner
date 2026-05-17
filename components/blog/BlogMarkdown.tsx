import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const linkClassName =
  "font-medium text-[#7a5a16] underline decoration-[#c9a454]/50 underline-offset-2 hover:text-[#a5802a]";

export function BlogMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => (
          <h2 className="mt-10 scroll-mt-24 text-2xl font-semibold tracking-tight text-[#0f1a33] first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-8 text-xl font-semibold text-[#0f1a33]">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="mt-4 text-[17px] leading-relaxed text-slate-700">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mt-4 list-disc space-y-2 pl-6 text-[17px] leading-relaxed text-slate-700">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-[17px] leading-relaxed text-slate-700">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="pl-0.5">{children}</li>,
        hr: () => <hr className="my-10 border-0 border-t border-slate-200/90" />,
        blockquote: ({ children }) => (
          <blockquote className="mt-6 border-l-4 border-[#c9a454]/55 bg-[#fffdf8] py-1 pl-4 pr-2 text-[17px] leading-relaxed text-slate-700">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="min-w-full border-collapse text-left text-[15px] text-slate-700">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-[#f8fafc]">{children}</thead>,
        th: ({ children }) => (
          <th className="border-b border-slate-200 px-4 py-2.5 font-semibold text-[#0f1a33]">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-slate-100 px-4 py-2.5 align-top">{children}</td>
        ),
        a: ({ href, children }) => {
          if (href?.startsWith("/")) {
            return (
              <Link href={href} className={linkClassName}>
                {children}
              </Link>
            );
          }
          return (
            <a
              href={href}
              className={linkClassName}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          );
        },
        strong: ({ children }) => <strong className="font-semibold text-[#0f1a33]">{children}</strong>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
