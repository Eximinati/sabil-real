'use client';

import { useState } from 'react';

const NOTICE_CONTENT = `🚧 Development Notice — Sabil Is Still Actively Evolving

Sabil was built within a limited hackathon timeline, and while the platform structure, architecture, and learning system are functional, portions of the educational content — especially Journey Day 1 — are still in an early authoring and formatting stage.

Due to submission deadlines, some lesson content is currently displayed as raw structured data rather than fully polished interactive learning modules. However, the underlying material was carefully researched and written using high-quality foundational Islamic educational sources and is intended as the base layer for a much richer experience.

What is already implemented:
• Functional journey system architecture
• Structured lesson engine
• Responsive mobile-first UI
• Accessibility-focused design
• Quran integration foundation
• Audio and reflection systems
• Modern scalable CMS structure
• Authentication and progress systems

What is still being improved:
• Automatic Quran verse enrichment
• Dynamic transliteration fetching
• Advanced lesson rendering
• Rich interactive block layouts
• Enhanced typography and readability
• Scholar-reviewed refinement of lesson content
• Better admin authoring workflows

The current Day 1 lesson represents our educational direction and vision rather than the final polished learning experience. Our goal is to transform these lessons into deeply interactive, immersive, and spiritually meaningful guided journeys.

We chose to submit the platform in its current state rather than delay sharing the vision behind Sabil.

Thank you for exploring the project and understanding the realities of hackathon development timelines. 🤍`;

export function FloatingNotice() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-[var(--color-accent)] rounded-full shadow-lg flex items-center justify-center text-white hover:opacity-90 transition-all hover:scale-105"
        aria-label="Development Notice"
        title="Development Notice"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-[var(--color-surface)] rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚧</span>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Development Notice</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(80vh-80px)]">
              <pre className="whitespace-pre-wrap text-sm text-[var(--color-text)] leading-relaxed font-sans">
                {NOTICE_CONTENT}
              </pre>
            </div>
            <div className="p-4 border-t border-[var(--color-border)] flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)]"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}