const DANGEROUS_TAGS = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea'];
const DANGEROUS_ATTRS = ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'];

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  let sanitized = html;
  
  DANGEROUS_TAGS.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
    
    const selfClosing = new RegExp(`<${tag}[^>]*\\/?>`, 'gi');
    sanitized = sanitized.replace(selfClosing, '');
  });
  
  DANGEROUS_ATTRS.forEach(attr => {
    const regex = new RegExp(`${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    sanitized = sanitized.replace(regex, '');
    
    const onAttrRegex = new RegExp(`on\\w+\\s*=\\s*["'][^"']*["']`, 'gi');
    sanitized = sanitized.replace(onAttrRegex, '');
  });
  
  const styleRegex = /style\s*=\s*["'][^"']*(expression|javascript|url\s*\(|behavior:)[^"']*["']/gi;
  sanitized = sanitized.replace(styleRegex, '');
  
  return sanitized;
}

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}