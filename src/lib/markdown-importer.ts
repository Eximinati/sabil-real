import { LessonBlock, BlockType, BlockContent } from '@/types/admin-journey';

export interface ParsedMarkdown {
  blocks: LessonBlock[];
  verseReferences: string[];
}

const QURAN_VERSE_PATTERN = /\((\d+):(\d+)\)/g;
const SURAH_PATTERN = /(Surah|Al-Fatiha|Al-Baqarah|Al-Kahf|Yusuf|Taha|Maryam|Al-Anbiya|Al-Isra|An-Nahl|Ar-Ra'd|Al-Muminun|Al-Furqan|Al-Qasas|Saba|Al-Ahzab|Sad|Yasin|Al-Fath|Al-Hujurat|Al-Kaf|Al-Maarij|Al-Mujadalah|Al-Hashr|Al-Mumtahanah|Al-Saffat|Fatir|Al-Mulk|Al-Qalam|Al-Haqqah|Al-Ma'un|Al-Kafirun|Al-Ikhlas|Al-Falaq|An-Nas)/gi;

const QURAN_API_BASE = 'https://api.quran.com/api/v4';

interface VerseData {
  verse_key: string;
  text_uthmani: string;
  translations?: Array<{ text: string; language_name: string }>;
}

export async function parseMarkdownToBlocks(
  markdown: string,
  fetchVerses: boolean = true
): Promise<ParsedMarkdown> {
  const lines = markdown.split('\n');
  const blocks: LessonBlock[] = [];
  const verseReferences: string[] = [];
  
  let i = 0;
  let currentSection: string | null = null;
  let sectionContent: string[] = [];
  let inBulletList = false;
  let bulletItems: string[] = [];
  let inReflection = false;
  let reflectionPrompts: string[] = [];
  
  const flushBulletList = () => {
    if (bulletItems.length > 0) {
      blocks.push({
        order_index: blocks.length,
        block_type: 'list',
        content: { items: [...bulletItems] },
      });
      bulletItems = [];
      inBulletList = false;
    }
  };
  
  const flushSection = () => {
    if (currentSection && sectionContent.length > 0) {
      const content = sectionContent.join('\n').trim();
      
      switch (currentSection) {
        case 'Arabic':
          blocks.push({
            order_index: blocks.length,
            block_type: 'arabic',
            content: { text: content },
          });
          break;
        case 'Roman Urdu Phonetics':
          blocks.push({
            order_index: blocks.length,
            block_type: 'transliteration',
            content: { text: content },
          });
          break;
        case 'English Translation':
          blocks.push({
            order_index: blocks.length,
            block_type: 'paragraph',
            content: { text: content },
          });
          break;
        case 'Reflection Task':
        case 'Practical Step':
          reflectionPrompts.push(content);
          break;
      }
      sectionContent = [];
      currentSection = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;
    
    if (trimmedLine === '') {
      flushBulletList();
      flushSection();
      i++;
      continue;
    }
    
    if (trimmedLine.startsWith('# ')) {
      flushBulletList();
      flushSection();
      blocks.push({
        order_index: blocks.length,
        block_type: 'heading',
        content: { text: trimmedLine.substring(2), level: 1 },
      });
    } else if (trimmedLine.startsWith('## ')) {
      flushBulletList();
      flushSection();
      blocks.push({
        order_index: blocks.length,
        block_type: 'heading',
        content: { text: trimmedLine.substring(3), level: 2 },
      });
    } else if (trimmedLine.startsWith('### ')) {
      flushBulletList();
      flushSection();
      blocks.push({
        order_index: blocks.length,
        block_type: 'heading',
        content: { text: trimmedLine.substring(4), level: 3 },
      });
    } else if (trimmedLine.startsWith('---')) {
      flushBulletList();
      flushSection();
      blocks.push({
        order_index: blocks.length,
        block_type: 'paragraph',
        content: { text: '___' },
      });
    } else if (trimmedLine.startsWith('**Arabic:**')) {
      flushBulletList();
      flushSection();
      currentSection = 'Arabic';
      sectionContent = [trimmedLine.replace('**Arabic:**', '').trim()];
    } else if (trimmedLine.startsWith('**Roman Urdu Phonetics:**') || trimmedLine.startsWith('**Roman Urdu:**')) {
      flushSection();
      currentSection = 'Roman Urdu Phonetics';
      sectionContent = [trimmedLine.replace(/\*\*(Roman Urdu Phonetics|Roman Urdu):\*\*/, '').trim()];
    } else if (trimmedLine.startsWith('**English Translation:**')) {
      flushSection();
      currentSection = 'English Translation';
      sectionContent = [trimmedLine.replace('**English Translation:**', '').trim()];
    } else if (trimmedLine.match(/^\d+:\d+$/)) {
      flushBulletList();
      flushSection();
      const verseKey = trimmedLine;
      verseReferences.push(verseKey);
      blocks.push({
        order_index: blocks.length,
        block_type: 'verse',
        content: { verse_key: verseKey },
      });
    } else if (trimmedLine.startsWith('> ')) {
      flushBulletList();
      flushSection();
      const quoteText = trimmedLine.substring(2);
      if (blocks.length > 0 && blocks[blocks.length - 1].block_type === 'quote') {
        const lastBlock = blocks[blocks.length - 1];
        lastBlock.content.text = (lastBlock.content.text || '') + '\n' + quoteText;
      } else {
        blocks.push({
          order_index: blocks.length,
          block_type: 'quote',
          content: { text: quoteText },
        });
      }
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      flushSection();
      inBulletList = true;
      bulletItems.push(trimmedLine.substring(2));
    } else if (trimmedLine.match(/^\d+\.\s/)) {
      flushSection();
      inBulletList = true;
      bulletItems.push(trimmedLine.replace(/^\d+\.\s/, ''));
    } else if (trimmedLine.startsWith('Reflection Task:') || trimmedLine.startsWith('Reflection:')) {
      flushBulletList();
      flushSection();
      inReflection = true;
      reflectionPrompts = [trimmedLine.replace(/^(Reflection Task:|Reflection:)\s*/, '')];
    } else if (trimmedLine.startsWith('Practical Step:') || trimmedLine.startsWith('Practical:')) {
      if (currentSection === 'Reflection Task' || currentSection === 'Reflection') {
        sectionContent.push(trimmedLine.replace(/^(Practical Step:|Practical:)\s*/, ''));
      } else {
        flushBulletList();
        flushSection();
        inReflection = true;
        reflectionPrompts = [trimmedLine.replace(/^(Practical Step:|Practical:)\s*/, '')];
      }
    } else if (currentSection) {
      sectionContent.push(trimmedLine);
    } else if (inReflection) {
      if (trimmedLine.startsWith('1.') || trimmedLine.startsWith('2.') || trimmedLine.startsWith('3.')) {
        reflectionPrompts.push(trimmedLine.replace(/^[123]\.\s*/, ''));
      } else {
        if (reflectionPrompts.length > 0) {
          reflectionPrompts[reflectionPrompts.length - 1] += '\n' + trimmedLine;
        }
      }
    } else if (inBulletList) {
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.match(/^\d+\.\s/)) {
        const item = trimmedLine.replace(/^(\d+\.\s|- |\*) /, '');
        bulletItems.push(item);
      } else {
        flushBulletList();
        const parsed = parseInlineFormatting(trimmedLine);
        blocks.push({
          order_index: blocks.length,
          block_type: 'paragraph',
          content: { text: parsed },
        });
      }
    } else {
      flushSection();
      const parsed = parseInlineFormatting(trimmedLine);
      blocks.push({
        order_index: blocks.length,
        block_type: 'paragraph',
        content: { text: parsed },
      });
    }
    
    i++;
  }
  
  flushBulletList();
  flushSection();
  
  if (reflectionPrompts.length > 0) {
    blocks.push({
      order_index: blocks.length,
      block_type: 'reflection',
      content: { prompts: reflectionPrompts },
    });
  }
  
  if (fetchVerses && verseReferences.length > 0) {
    await enrichVersesWithData(blocks);
  }
  
  return { blocks, verseReferences };
}

function parseInlineFormatting(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '**$1**')
    .replace(/\*([^*]+)\*/g, '*$1*');
}

async function enrichVersesWithData(blocks: LessonBlock[]): Promise<void> {
  const verseBlocks = blocks.filter(b => b.block_type === 'verse');
  
  for (const block of verseBlocks) {
    const verseKey = block.content.verse_key;
    if (!verseKey) continue;
    
    try {
      const [chapter, verse] = verseKey.split(':');
      const response = await fetch(
        `${QURAN_API_BASE}/verses/by_key/${verseKey}?language=en&words=true`
      );
      
      if (response.ok) {
        const data = await response.json();
        const verseData: VerseData = data.verse;
        
        block.content.arabic_text = verseData.text_uthmani;
        
        const translations = verseData.translations?.find(t => t.language_name === 'english');
        if (translations) {
          block.content.translation = translations.text;
        }
      }
    } catch (error) {
      console.error(`Failed to fetch verse ${verseKey}:`, error);
    }
  }
}

export function generateMarkdownFromBlocks(blocks: LessonBlock[]): string {
  let markdown = '';
  
  for (const block of blocks) {
    switch (block.block_type) {
      case 'heading':
        const prefix = '#'.repeat(block.content.level || 2);
        markdown += `${prefix} ${block.content.text || ''}\n\n`;
        break;
      case 'paragraph':
        if (block.content.text === '___') {
          markdown += '---\n\n';
        } else {
          markdown += `${block.content.text || ''}\n\n`;
        }
        break;
      case 'arabic':
        markdown += `**Arabic:**\n${block.content.text || ''}\n\n`;
        break;
      case 'transliteration':
        markdown += `**Roman Urdu Phonetics:**\n"${block.content.text || ''}"\n\n`;
        if (block.content.translation) {
          markdown += `**English Translation:**\n${block.content.translation}\n\n`;
        }
        break;
      case 'verse':
        markdown += `${block.content.verse_key || ''}\n\n`;
        break;
      case 'quote':
        markdown += `> ${block.content.text || ''}\n`;
        if (block.content.source) {
          markdown += `\n— ${block.content.source}\n`;
        }
        markdown += '\n';
        break;
      case 'reflection':
        const prompts = block.content.prompts || [block.content.prompt].filter(Boolean);
        prompts.forEach((prompt, idx) => {
          markdown += `${idx + 1}. ${prompt}\n`;
        });
        markdown += '\n';
        break;
      case 'list':
        const items = block.content.items || [];
        items.forEach(item => {
          markdown += `- ${item}\n`;
        });
        markdown += '\n';
        break;
    }
  }
  
  return markdown;
}