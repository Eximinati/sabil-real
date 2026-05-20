'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  JourneyLessonMetadata, 
  LessonBlock, 
  BlockType,
  BLOCK_TYPE_LABELS,
  createEmptyBlock 
} from '@/types/admin-journey';
import { LessonRenderer } from './lesson-renderer';
import { saveLesson } from '@/lib/admin-journey-actions';
import { useToast } from '@/hooks/use-toast';
import { MarkdownImporter } from './markdown-importer';

interface LessonEditorProps {
  initialData?: {
    metadata: JourneyLessonMetadata;
    blocks: LessonBlock[];
  };
  userId: string;
}

const BLOCK_TYPES: BlockType[] = [
  'heading', 'paragraph', 'arabic', 'transliteration', 'verse', 'quote', 'reflection', 'list'
];

export function LessonEditor({ initialData, userId }: LessonEditorProps) {
  const router = useRouter();
  const toast = useToast();
  
  const [metadata, setMetadata] = useState<JourneyLessonMetadata>(
    initialData?.metadata || {
      day_number: 1,
      title: '',
      subtitle: '',
      topic: '',
      description: '',
      estimated_minutes: 15,
      is_published: false,
    }
  );

  const [blocks, setBlocks] = useState<LessonBlock[]>(
    initialData?.blocks || []
  );

  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [metadata, blocks]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSave = async (publish: boolean = false) => {
    if (!metadata.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setSaving(true);
    const updatedMetadata = { ...metadata, is_published: publish };
    
    const result = await saveLesson(
      { metadata: updatedMetadata, blocks },
      userId
    );

    setSaving(false);

    if (result.success) {
      setMetadata(updatedMetadata);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast.success(publish ? 'Lesson published!' : 'Draft saved');
      
      if (!initialData?.metadata?.id) {
        router.replace(`/admin/journey/${result.lessonId}/edit`);
      }
    } else {
      toast.error(result.error || 'Failed to save');
    }
  };

  const addBlock = (type: BlockType) => {
    const newBlock = createEmptyBlock(type, blocks.length);
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (index: number, updates: Partial<LessonBlock>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    setBlocks(newBlocks);
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks.map((b, i) => ({ ...b, order_index: i })));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Editor Panel */}
      <div className="flex-1 min-w-0">
        {/* Metadata Section */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-4">Lesson Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                Day Number
              </label>
              <input
                type="number"
                value={metadata.day_number}
                onChange={(e) => setMetadata({ ...metadata, day_number: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
                min={1}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                Estimated Minutes
              </label>
              <input
                type="number"
                value={metadata.estimated_minutes}
                onChange={(e) => setMetadata({ ...metadata, estimated_minutes: parseInt(e.target.value) || 15 })}
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
                min={1}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              Title
            </label>
            <input
              type="text"
              value={metadata.title}
              onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
              placeholder="Lesson title"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              Subtitle
            </label>
            <input
              type="text"
              value={metadata.subtitle}
              onChange={(e) => setMetadata({ ...metadata, subtitle: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
              placeholder="Optional subtitle"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              Topic
            </label>
            <input
              type="text"
              value={metadata.topic}
              onChange={(e) => setMetadata({ ...metadata, topic: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
              placeholder="e.g., Purpose & Creation"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              Description (Overview)
            </label>
            <textarea
              value={metadata.description}
              onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none"
              rows={3}
              placeholder="Brief description for the lesson overview"
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <input
              type="checkbox"
              id="is_published"
              checked={metadata.is_published}
              onChange={(e) => setMetadata({ ...metadata, is_published: e.target.checked })}
              className="w-4 h-4 rounded border-[var(--color-border)]"
            />
            <label htmlFor="is_published" className="text-sm text-[var(--color-text)]">
              Published
            </label>
          </div>
        </div>

        {/* Blocks Section */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-[var(--color-text)]">Content Blocks</h2>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-3 py-1.5 bg-[var(--color-accent)] text-white text-sm rounded-lg hover:opacity-90"
              >
                Import Markdown
              </button>
              <div className="relative group">
                <button className="px-3 py-1.5 bg-[var(--color-primary)] text-white text-sm rounded-lg hover:bg-[var(--color-primary-hover)]">
                  + Add Block
                </button>
                <div className="absolute right-0 top-full mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[180px]">
                  {BLOCK_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => addBlock(type)}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] first:rounded-t-lg last:rounded-b-lg"
                    >
                      {BLOCK_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {blocks.length === 0 ? (
            <p className="text-[var(--color-text-muted)] text-sm text-center py-8">
              No content blocks yet. Click "Add Block" to start building your lesson.
            </p>
          ) : (
            <div className="space-y-4">
              {blocks.map((block, index) => (
                <BlockEditor
                  key={block.id || index}
                  block={block}
                  index={index}
                  onUpdate={(updates) => updateBlock(index, updates)}
                  onRemove={() => removeBlock(index)}
                  onMoveUp={() => moveBlock(index, 'up')}
                  onMoveDown={() => moveBlock(index, 'down')}
                  canMoveUp={index > 0}
                  canMoveDown={index < blocks.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-[var(--color-text-muted)]">
            {hasUnsavedChanges && <span>Unsaved changes</span>}
            {lastSaved && !hasUnsavedChanges && (
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text)] rounded-lg hover:bg-[var(--color-bg)] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              {saving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      {showPreview && (
        <div className="lg:w-[400px] shrink-0">
          <div className="sticky top-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-[var(--color-text-muted)]">Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                Hide
              </button>
            </div>
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden max-h-[calc(100vh-200px)] overflow-y-auto">
              <LessonRenderer metadata={metadata} blocks={blocks} />
            </div>
          </div>
        </div>
      )}

      {/* Import Markdown Modal */}
      <MarkdownImporter
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={(importedBlocks) => {
          const newBlocks = importedBlocks.map((block, idx) => ({
            ...block,
            order_index: blocks.length + idx,
          }));
          setBlocks([...blocks, ...newBlocks]);
          setHasUnsavedChanges(true);
          toast.success(`Imported ${newBlocks.length} blocks`);
        }}
        existingBlocks={blocks}
      />
    </div>
  );
}

interface BlockEditorProps {
  block: LessonBlock;
  index: number;
  onUpdate: (updates: Partial<LessonBlock>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function BlockEditor({
  block,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: BlockEditorProps) {
  return (
    <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase">
            {BLOCK_TYPE_LABELS[block.block_type]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30"
            title="Move up"
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30"
            title="Move down"
          >
            ↓
          </button>
          <button
            onClick={onRemove}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)] ml-2"
            title="Remove block"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <BlockContentEditor block={block} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

function BlockContentEditor({
  block,
  onUpdate,
}: {
  block: LessonBlock;
  onUpdate: (updates: Partial<LessonBlock>) => void;
}) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...block.content, [key]: value } });
  };

  switch (block.block_type) {
    case 'heading':
      return (
        <div className="space-y-3">
          <select
            value={block.content.level || 2}
            onChange={(e) => updateContent('level', parseInt(e.target.value))}
            className="px-2 py-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded text-sm"
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
          <input
            type="text"
            value={block.content.text || ''}
            onChange={(e) => updateContent('text', e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
            placeholder="Heading text"
          />
        </div>
      );

    case 'paragraph':
      const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateContent('text', e.target.value);
      };
      return (
        <div>
          <div className="flex gap-1 mb-2">
            <button
              type="button"
              onClick={() => {
                const currentText = block.content.text || '';
                const selection = window.getSelection()?.toString();
                if (selection) {
                  const newText = currentText.replace(selection, `**${selection}**`);
                  updateContent('text', newText);
                }
              }}
              className="px-2 py-1 text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded hover:bg-[var(--color-border)]"
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => {
                const currentText = block.content.text || '';
                const selection = window.getSelection()?.toString();
                if (selection) {
                  const newText = currentText.replace(selection, `*${selection}*`);
                  updateContent('text', newText);
                }
              }}
              className="px-2 py-1 text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded hover:bg-[var(--color-border)] italic"
              title="Italic"
            >
              I
            </button>
          </div>
          <textarea
            value={block.content.text || ''}
            onChange={handleTextChange}
            className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none font-mono text-sm"
            rows={6}
            placeholder="Paragraph text... (Use **text** for bold, *text* for italic)"
          />
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Use **text** for bold, *text* for italic
          </p>
        </div>
      );

    case 'arabic':
      return (
        <div>
          <textarea
            value={block.content.text || ''}
            onChange={(e) => updateContent('text', e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none font-arabic text-2xl text-right"
            rows={3}
            dir="rtl"
            placeholder="Arabic text..."
          />
        </div>
      );

    case 'transliteration':
      return (
        <div className="space-y-3">
          <textarea
            value={block.content.text || ''}
            onChange={(e) => updateContent('text', e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none"
            rows={2}
            placeholder="Transliteration..."
          />
          <textarea
            value={block.content.translation || ''}
            onChange={(e) => updateContent('translation', e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none"
            rows={2}
            placeholder="Translation..."
          />
        </div>
      );

    case 'verse':
      return (
        <div>
          <input
            type="text"
            value={block.content.verse_key || ''}
            onChange={(e) => updateContent('verse_key', e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] mb-2"
            placeholder="Verse key (e.g., 2:255)"
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            This will render the verse with audio using existing Quran systems.
          </p>
        </div>
      );

    case 'quote':
      return (
        <div className="space-y-3">
          <textarea
            value={block.content.text || ''}
            onChange={(e) => updateContent('text', e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none"
            rows={3}
            placeholder="Quote text..."
          />
          <input
            type="text"
            value={block.content.source || ''}
            onChange={(e) => updateContent('source', e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
            placeholder="Source (e.g., Sahih Muslim 2865)"
          />
        </div>
      );

    case 'reflection':
      const prompts = block.content.prompts || [''];
      const updatePrompt = (idx: number, value: string) => {
        const newPrompts = [...prompts];
        newPrompts[idx] = value;
        updateContent('prompts', newPrompts);
      };
      const addPrompt = () => updateContent('prompts', [...prompts, '']);
      const removePrompt = (idx: number) => {
        if (prompts.length > 1) {
          updateContent('prompts', prompts.filter((_, i) => i !== idx));
        }
      };
      return (
        <div className="space-y-2">
          {prompts.map((prompt, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="mt-2 text-sm font-medium text-[var(--color-primary)]">{idx + 1}.</span>
              <textarea
                value={prompt}
                onChange={(e) => updatePrompt(idx, e.target.value)}
                className="flex-1 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none"
                rows={2}
                placeholder={`Reflection prompt ${idx + 1}...`}
              />
              <button
                onClick={() => removePrompt(idx)}
                className="mt-2 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
                title="Remove prompt"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={addPrompt}
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            + Add reflection prompt
          </button>
        </div>
      );

    case 'list':
      const items = block.content.items || [''];
      const updateItem = (idx: number, value: string) => {
        const newItems = [...items];
        newItems[idx] = value;
        updateContent('items', newItems);
      };
      const addItem = () => updateContent('items', [...items, '']);
      const removeItem = (idx: number) => {
        if (items.length > 1) {
          updateContent('items', items.filter((_, i) => i !== idx));
        }
      };
      return (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-[var(--color-text-muted)]">•</span>
              <input
                type="text"
                value={item}
                onChange={(e) => updateItem(idx, e.target.value)}
                className="flex-1 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
                placeholder="List item..."
              />
              <button
                onClick={() => removeItem(idx)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={addItem}
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            + Add item
          </button>
        </div>
      );

    default:
      return null;
  }
}