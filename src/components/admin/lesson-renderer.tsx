'use client';

import { JourneyLessonMetadata, LessonBlock } from '@/types/admin-journey';

interface LessonRendererProps {
  metadata: JourneyLessonMetadata;
  blocks: LessonBlock[];
}

export function LessonRenderer({ metadata, blocks }: LessonRendererProps) {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-2.5 py-1 bg-[var(--color-accent)] text-white rounded-full text-xs">
            Day {metadata.day_number}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            ~{metadata.estimated_minutes} min
          </span>
          {!metadata.is_published && (
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
              Draft
            </span>
          )}
        </div>
        
        {metadata.topic && (
          <span className="inline-block px-2 py-1 bg-[var(--color-bg)] text-[var(--color-primary)] rounded text-xs mb-2">
            {metadata.topic}
          </span>
        )}
        
        <h1 className="text-xl font-semibold text-[var(--color-text)]">{metadata.title}</h1>
        {metadata.subtitle && (
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{metadata.subtitle}</p>
        )}
      </div>

      {/* Description */}
      {metadata.description && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-[var(--color-text-muted)] uppercase mb-2">Overview</h2>
          <p className="text-sm text-[var(--color-text)] leading-relaxed">{metadata.description}</p>
        </div>
      )}

      {/* Blocks */}
      <div className="space-y-6">
        {blocks.map((block, index) => (
          <BlockRenderer key={block.id || index} block={block} />
        ))}
      </div>

      {blocks.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
          No content yet
        </p>
      )}
    </div>
  );
}

function BlockRenderer({ block }: { block: LessonBlock }) {
  const { block_type, content } = block;

  switch (block_type) {
    case 'heading':
      const level = content.level || 2;
      const headingClasses: Record<number, string> = {
        1: 'text-2xl font-bold text-[var(--color-text)] mt-6 mb-3',
        2: 'text-xl font-semibold text-[var(--color-text)] mt-5 mb-2',
        3: 'text-lg font-medium text-[var(--color-text)] mt-4 mb-2',
      };
      const className = headingClasses[level] || headingClasses[2];
      
      if (level === 1) {
        return <h1 className={className}>{content.text}</h1>;
      } else if (level === 2) {
        return <h2 className={className}>{content.text}</h2>;
      } else {
        return <h3 className={className}>{content.text}</h3>;
      }

    case 'paragraph':
      const renderRichText = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={i}>{part.slice(1, -1)}</em>;
          }
          return part;
        });
      };
      return (
        <p className="text-[15px] leading-[1.8] text-[var(--color-text)]">
          {renderRichText(content.text || '')}
        </p>
      );

    case 'arabic':
      return (
        <div className="my-4">
          <p 
            className="font-arabic text-[24px] md:text-[28px] text-right text-[var(--color-text)] leading-[2]"
            dir="rtl"
          >
            {content.text}
          </p>
        </div>
      );

    case 'transliteration':
      return (
        <div className="my-4 bg-[var(--color-bg)] rounded-lg p-4 border border-[var(--color-border)]">
          {content.text && (
            <p className="text-[16px] italic text-[var(--color-text)] leading-relaxed mb-3">
              {content.text}
            </p>
          )}
          {content.translation && (
            <>
              <div className="h-px bg-[var(--color-border)] my-3" />
              <p className="text-[14px] text-[var(--color-text-muted)]">
                {content.translation}
              </p>
            </>
          )}
        </div>
      );

    case 'verse':
      return (
        <div className="my-4 p-4 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[var(--color-primary)] text-sm">✦</span>
            <span className="text-sm font-medium text-[var(--color-primary)]">
              Quran Verse: {content.verse_key}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            This verse will render with translations and audio from Quran systems.
          </p>
        </div>
      );

    case 'quote':
      return (
        <div className="my-4 relative">
          <span className="font-arabic text-[48px] text-[var(--color-accent)] absolute top-0 left-0 opacity-30" dir="rtl">"</span>
          <blockquote className="pl-8 pr-4 py-2">
            <p className="text-[15px] italic leading-relaxed text-[var(--color-text)]">
              {content.text}
            </p>
            {content.source && (
              <p className="text-xs text-[var(--color-text-muted)] mt-2 text-right">
                — {content.source}
              </p>
            )}
          </blockquote>
        </div>
      );

    case 'reflection':
      const reflectionPrompts = content.prompts || (content.prompt ? [content.prompt] : []);
      return (
        <div className="my-4">
          <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase mb-2">Reflection</h3>
          <div className="bg-[var(--color-bg)] rounded-xl p-4 border border-[var(--color-primary)]/20 space-y-3">
            {reflectionPrompts.filter(Boolean).map((prompt, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-[var(--color-primary)] font-medium text-sm">{idx + 1}.</span>
                <p className="text-[15px] text-[var(--color-text)] flex-1">
                  {prompt}
                </p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'list':
      const items = content.items || [];
      return (
        <ul className="my-4 space-y-2">
          {items.filter(Boolean).map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[15px] text-[var(--color-text)]">
              <span className="text-[var(--color-accent)] mt-1">•</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      );

    default:
      return null;
  }
}