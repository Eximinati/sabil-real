'use client';

import ReactMarkdown from 'react-markdown';

interface LessonTextInnerProps {
  lessonText: string;
}

export function LessonTextInner({ lessonText }: LessonTextInnerProps) {
  return (
    <div className="mb-8">
      <h2 className="section-heading">Lesson</h2>
      <div className="prose max-w-none">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="text-[16px] leading-[1.9] text-[var(--color-text)] mb-5">{children}</p>,
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