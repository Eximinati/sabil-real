'use client';

import ReactMarkdown from 'react-markdown';

interface LessonTextInnerProps {
  lessonText: string;
}

export function LessonTextInner({ lessonText }: LessonTextInnerProps) {
  return (
    <div className="mb-10">
      <h2 className="section-heading">Sit with this</h2>
      <div className="prose max-w-none">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-6 text-[16px] leading-[1.95] text-[var(--color-text)]">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            em: ({ children }) => <em className="italic text-[var(--color-text-secondary)]">{children}</em>,
          }}
        >
          {lessonText}
        </ReactMarkdown>
      </div>
    </div>
  );
}
