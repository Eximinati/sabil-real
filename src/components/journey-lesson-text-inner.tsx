'use client';

import ReactMarkdown from 'react-markdown';
import { useCopy } from '@/hooks/use-copy';
import { useLanguage } from '@/lib/i18n/context';

interface LessonTextInnerProps {
  lessonText: string;
}

export function LessonTextInner({ lessonText }: LessonTextInnerProps) {
  const isUrdu = /[\u0600-\u06FF]/.test(lessonText);
  const copy = useCopy();
  const { language } = useLanguage();
  const isUrduReading = isUrdu || language === 'ur';

  return (
    <div className="reading-section">
      <h2 className="section-heading">{copy.journey.lesson.lessonTextTitle}</h2>
      <div className={`max-w-none ${isUrduReading ? 'reading-prose-urdu' : 'reading-prose'}`}>
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p
                className={`mb-5 text-[var(--color-text)] ${isUrduReading ? 'reading-prose-urdu' : 'reading-prose'}`}
                dir={isUrduReading ? 'rtl' : 'ltr'}
                data-script-direction={isUrduReading ? 'rtl' : 'ltr'}
              >
                {children}
              </p>
            ),
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
