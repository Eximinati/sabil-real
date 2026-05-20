'use client';

import { useState, useEffect } from 'react';
import { LessonBlock, BLOCK_TYPE_LABELS, BlockType } from '@/types/admin-journey';
import { parseMarkdownToBlocks, generateMarkdownFromBlocks } from '@/lib/markdown-importer';
import { LessonRenderer } from './lesson-renderer';

interface MarkdownImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (blocks: LessonBlock[]) => void;
  existingBlocks?: LessonBlock[];
}

const BLOCK_TYPES: BlockType[] = [
  'heading', 'paragraph', 'arabic', 'transliteration', 'verse', 'quote', 'reflection', 'list'
];

export function MarkdownImporter({ isOpen, onClose, onImport, existingBlocks = [] }: MarkdownImporterProps) {
  const [markdown, setMarkdown] = useState('');
  const [parsedBlocks, setParsedBlocks] = useState<LessonBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && existingBlocks.length > 0) {
      const existingMarkdown = generateMarkdownFromBlocks(existingBlocks);
      setMarkdown(existingMarkdown);
    }
  }, [isOpen, existingBlocks]);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!markdown.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await parseMarkdownToBlocks(markdown, true);
      setParsedBlocks(result.blocks);
      setActiveTab('preview');
    } catch (error) {
      console.error('Failed to parse markdown:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    onImport(parsedBlocks);
    setMarkdown('');
    setParsedBlocks([]);
    onClose();
  };

  const handleClear = () => {
    setMarkdown('');
    setParsedBlocks([]);
  };

  const sampleMarkdown = `# Section 1: The Shahada

## Part A: The Oneness of God

**Arabic:** لَا إِلَهَ إِلَّا اللَّهُ

**Roman Urdu Phonetics:** "La ilaha illa Allah"

**English Translation:** There is no god but Allah.

The Shahada is the very heartbeat of Islam. It is not merely a sentence to be spoken, but a complete transformation of one's existence.

- First, it declares the absolute uniqueness of God
- Second, it denies the existence of any other god
- Third, it affirms that all worship is due to Allah alone

> The Prophet (s.a.w.) said: "La ilaha illa Allah" is the best statement anyone can say.

## Part B: The Prophethood

**Arabic:** مُحَمَّدٌ رَسُولُ اللَّهِ

**Roman Urdu Phonetics:** "Muhammadur Rasoolullah"

**English Translation:** Muhammad is the messenger of Allah.

1. Accepting the Prophet as the ultimate role model
2. Following his Sunnah in daily life
3. Believing in his message completely

(112:1)
(2:255)
(1:1)

## Reflection

1. What does it mean to shift your ultimate love from created things to the Creator?
2. How do you apply the Sunnah in your daily routine?
3. What hidden attachments might be overriding your values?

## Practical Step

Choose one "hidden attachment" you identified. For the next seven days, consciously turn to Allah instead of that thing when you feel anxious.
`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-6xl h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-[var(--color-border)] shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text)]">Import Markdown</h2>
            <p className="text-xs md:text-sm text-[var(--color-text-muted)] hidden sm:block">Paste markdown content to convert to lesson blocks</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border)] shrink-0">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 md:px-6 py-2 md:py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)]'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 md:px-6 py-2 md:py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)]'
            }`}
          >
            Preview ({parsedBlocks.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden min-h-0">
          {activeTab === 'editor' ? (
            <div className="flex h-full min-h-0">
              {/* Editor */}
              <div className="flex-1 flex flex-col p-4 border-r border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[var(--color-text)]">
                    Markdown Content
                  </label>
                  <button
                    onClick={() => setMarkdown(sampleMarkdown)}
                    className="text-sm text-[var(--color-primary)] hover:underline"
                  >
                    Load Sample
                  </button>
                </div>
                <textarea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  className="flex-1 w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] font-mono text-sm resize-none"
                  placeholder="Paste your markdown lesson content here...

Supported syntax:
- # Heading (H1)
- ## Heading (H2)
- ### Heading (H3)
- **Bold** and *italic*
- - Bullet lists
- > Blockquotes
- **Arabic:** for Arabic text
- **Roman Urdu Phonetics:** for transliteration
- **English Translation:** for translations
- (112:1) for Quran verse references
- 1. 2. 3. for numbered lists
- --- for separators"
                />
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={handleClear}
                    className="px-4 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleParse}
                    disabled={!markdown.trim() || isLoading}
                    className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                  >
                    {isLoading ? 'Parsing...' : 'Parse Markdown'}
                  </button>
                </div>
              </div>

              {/* Syntax Help */}
              <div className="w-72 p-4 overflow-y-auto">
                <h3 className="text-sm font-medium text-[var(--color-text)] mb-3">Syntax Guide</h3>
                <div className="space-y-3 text-xs text-[var(--color-text-muted)]">
                  <div>
                    <code className="text-[var(--color-primary)]"># Heading</code>
                    <p>H1 Heading</p>
                  </div>
                  <div>
                    <code className="text-[var(--color-primary)]">## Heading</code>
                    <p>H2 Heading</p>
                  </div>
                  <div>
                    <code className="text-[var(--color-primary)]">### Heading</code>
                    <p>H3 Heading</p>
                  </div>
                  <div>
                    <code className="text-[var(--color-primary)]">**Bold**</code>
                    <p>Bold text</p>
                  </div>
                  <div>
                    <code className="text-[var(--color-primary)]">*italic*</code>
                    <p>Italic text</p>
                  </div>
                  <div>
                    <code className="text-[var(--color-primary)]">- item</code>
                    <p>Bullet list</p>
                  </div>
                  <div>
                    <code className="text-[var(--color-primary)]">1. item</code>
                    <p>Numbered list</p>
                  </div>
                  <div>
                    <code className="text-[var(--color-primary)]">&gt; quote</code>
                    <p>Blockquote</p>
                  </div>
                  <div>
                    <code className="text-[var(--color-primary)]">**Arabic:**</code>
                    <p>Arabic text block</p>
                  </div>
                  <div>
                    <code className="text-[var(--color-primary)]">**Roman Urdu:**</code>
                    <p>Transliteration block</p>
                  </div>
                  <div>
                    <code className="text-[var(--color-primary)]">(112:1)</code>
                    <p>Quran verse ref</p>
                  </div>
                  <div>
                    <code className="text-[var(--color-primary)]">---</code>
                    <p>Separator</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-0">
              {/* Blocks List - Left Panel */}
              <div className="w-64 border-r border-[var(--color-border)] flex flex-col min-w-0">
                <div className="p-2 md:p-3 border-b border-[var(--color-border)] shrink-0">
                  <h3 className="text-sm font-medium text-[var(--color-text)]">Blocks ({parsedBlocks.length})</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {parsedBlocks.map((block, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedBlockIndex(index)}
                      className={`w-full text-left p-2 rounded-lg border text-xs transition-colors ${
                        selectedBlockIndex === index
                          ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]'
                          : 'bg-[var(--color-bg)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[var(--color-text-muted)] w-4">{index + 1}.</span>
                        <span className="px-1 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded text-[10px]">
                          {BLOCK_TYPE_LABELS[block.block_type].split(' ')[0]}
                        </span>
                      </div>
                      <div className="text-[var(--color-text)] truncate mt-1 opacity-80">
                        {block.block_type === 'heading' && block.content.text?.substring(0, 25)}
                        {block.block_type === 'paragraph' && block.content.text?.substring(0, 25)}
                        {block.block_type === 'arabic' && block.content.text?.substring(0, 15)}
                        {block.block_type === 'transliteration' && block.content.text?.substring(0, 20)}
                        {block.block_type === 'verse' && block.content.verse_key}
                        {block.block_type === 'quote' && block.content.text?.substring(0, 20)}
                        {block.block_type === 'reflection' && `${block.content.prompts?.length || 0} prompts`}
                        {block.block_type === 'list' && `${block.content.items?.length || 0} items`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview / Editor - Right Panel */}
              <div className="flex-1 min-w-0 overflow-y-auto p-3 md:p-4">
                {selectedBlockIndex !== null ? (
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-[var(--color-text)]">
                        Edit Block #{selectedBlockIndex + 1} - {BLOCK_TYPE_LABELS[parsedBlocks[selectedBlockIndex].block_type]}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newBlocks = [...parsedBlocks];
                            const [removed] = newBlocks.splice(selectedBlockIndex, 1);
                            newBlocks.splice(selectedBlockIndex - 1, 0, removed);
                            setParsedBlocks(newBlocks);
                            setSelectedBlockIndex(Math.max(0, selectedBlockIndex - 1));
                          }}
                          disabled={selectedBlockIndex === 0}
                          className="px-2 py-1 text-xs border border-[var(--color-border)] rounded hover:bg-[var(--color-bg)] disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => {
                            const newBlocks = [...parsedBlocks];
                            const [removed] = newBlocks.splice(selectedBlockIndex, 1);
                            newBlocks.splice(selectedBlockIndex + 1, 0, removed);
                            setParsedBlocks(newBlocks);
                            setSelectedBlockIndex(Math.min(parsedBlocks.length - 1, selectedBlockIndex + 1));
                          }}
                          disabled={selectedBlockIndex === parsedBlocks.length - 1}
                          className="px-2 py-1 text-xs border border-[var(--color-border)] rounded hover:bg-[var(--color-bg)] disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => {
                            const newBlocks = parsedBlocks.filter((_, i) => i !== selectedBlockIndex);
                            setParsedBlocks(newBlocks);
                            setSelectedBlockIndex(null);
                          }}
                          className="px-2 py-1 text-xs border border-[var(--color-error)] text-[var(--color-error)] rounded hover:bg-[var(--color-error)]/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <BlockEditor
                      block={parsedBlocks[selectedBlockIndex]}
                      onChange={(updatedBlock) => {
                        const newBlocks = [...parsedBlocks];
                        newBlocks[selectedBlockIndex] = updatedBlock;
                        setParsedBlocks(newBlocks);
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-[var(--color-text)]">Live Preview</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setParsedBlocks([...parsedBlocks, { order_index: parsedBlocks.length, block_type: 'paragraph', content: { text: '' } }]);
                            setSelectedBlockIndex(parsedBlocks.length);
                          }}
                          className="px-3 py-1.5 text-xs bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)]"
                        >
                          + Add Block
                        </button>
                      </div>
                    </div>
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
                      <LessonRenderer 
                        metadata={{
                          day_number: 1,
                          title: 'Preview',
                          subtitle: '',
                          topic: '',
                          description: '',
                          estimated_minutes: 15,
                          is_published: false,
                        }} 
                        blocks={parsedBlocks} 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {parsedBlocks.length > 0 && activeTab === 'preview' && (
          <div className="flex items-center justify-between px-4 md:px-6 py-3 border-t border-[var(--color-border)] shrink-0">
            <div className="text-sm text-[var(--color-text-muted)]">
              {parsedBlocks.length} blocks
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('editor')}
                className="px-3 md:px-4 py-2 text-sm border border-[var(--color-border)] text-[var(--color-text)] rounded-lg hover:bg-[var(--color-bg)]"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                className="px-3 md:px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)]"
              >
                Import {parsedBlocks.length} Blocks
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface BlockEditorProps {
  block: LessonBlock;
  onChange: (block: LessonBlock) => void;
}

function BlockEditor({ block, onChange }: BlockEditorProps) {
  const updateContent = (key: string, value: unknown) => {
    onChange({ ...block, content: { ...block.content, [key]: value } });
  };

  switch (block.block_type) {
    case 'heading':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--color-text-muted)]">Level</label>
            <select
              value={block.content.level || 2}
              onChange={(e) => updateContent('level', parseInt(e.target.value))}
              className="w-full mt-1 px-2 py-1.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded text-sm"
            >
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)]">Text</label>
            <input
              type="text"
              value={block.content.text || ''}
              onChange={(e) => updateContent('text', e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
            />
          </div>
        </div>
      );

    case 'paragraph':
      return (
        <div>
          <label className="text-xs text-[var(--color-text-muted)]">Text</label>
          <textarea
            value={block.content.text || ''}
            onChange={(e) => updateContent('text', e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none"
            rows={4}
          />
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Use **text** for bold, *text* for italic</p>
        </div>
      );

    case 'arabic':
      return (
        <div>
          <label className="text-xs text-[var(--color-text-muted)]">Arabic Text</label>
          <textarea
            value={block.content.text || ''}
            onChange={(e) => updateContent('text', e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] font-arabic text-right resize-none"
            rows={2}
            dir="rtl"
          />
        </div>
      );

    case 'transliteration':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--color-text-muted)]">Transliteration</label>
            <textarea
              value={block.content.text || ''}
              onChange={(e) => updateContent('text', e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none"
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)]">Translation</label>
            <textarea
              value={block.content.translation || ''}
              onChange={(e) => updateContent('translation', e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none"
              rows={2}
            />
          </div>
        </div>
      );

    case 'verse':
      return (
        <div>
          <label className="text-xs text-[var(--color-text-muted)]">Verse Key (e.g., 112:1)</label>
          <input
            type="text"
            value={block.content.verse_key || ''}
            onChange={(e) => updateContent('verse_key', e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
          />
        </div>
      );

    case 'quote':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--color-text-muted)]">Quote Text</label>
            <textarea
              value={block.content.text || ''}
              onChange={(e) => updateContent('text', e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)]">Source</label>
            <input
              type="text"
              value={block.content.source || ''}
              onChange={(e) => updateContent('source', e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
            />
          </div>
        </div>
      );

    case 'reflection':
      const prompts = block.content.prompts || [''];
      return (
        <div className="space-y-2">
          <label className="text-xs text-[var(--color-text-muted)]">Reflection Prompts</label>
          {prompts.map((prompt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-primary)] font-medium">{idx + 1}.</span>
              <textarea
                value={prompt}
                onChange={(e) => {
                  const newPrompts = [...prompts];
                  newPrompts[idx] = e.target.value;
                  updateContent('prompts', newPrompts);
                }}
                className="flex-1 px-2 py-1.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text)] resize-none"
                rows={2}
              />
              {prompts.length > 1 && (
                <button
                  onClick={() => updateContent('prompts', prompts.filter((_, i) => i !== idx))}
                  className="text-xs text-[var(--color-error)] hover:underline"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => updateContent('prompts', [...prompts, ''])}
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            + Add Prompt
          </button>
        </div>
      );

    case 'list':
      const items = block.content.items || [''];
      return (
        <div className="space-y-2">
          <label className="text-xs text-[var(--color-text-muted)]">List Items</label>
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-[var(--color-text-muted)]">•</span>
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx] = e.target.value;
                  updateContent('items', newItems);
                }}
                className="flex-1 px-2 py-1.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text)]"
              />
              {items.length > 1 && (
                <button
                  onClick={() => updateContent('items', items.filter((_, i) => i !== idx))}
                  className="text-xs text-[var(--color-error)] hover:underline"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => updateContent('items', [...items, ''])}
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            + Add Item
          </button>
        </div>
      );

    default:
      return null;
  }
}