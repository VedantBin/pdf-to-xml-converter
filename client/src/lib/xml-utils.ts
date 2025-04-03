/**
 * Formats bytes to a human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Simple XML syntax highlighting
 */
export function highlightXml(xml: string): string {
  return xml
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("[^"]*")/g, '<span class="xml-attr">$1</span>')
    .replace(/&lt;([\/\w\s]*?)&gt;/g, '<span class="xml-tag">&lt;$1&gt;</span>')
    .replace(/&lt;\?([\s\S]*?)\?&gt;/g, '<span class="xml-tag">&lt;?$1?&gt;</span>');
}

/**
 * Formats a date for display in the conversion history
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  if (dateObj >= today) {
    return `Today, ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (dateObj >= yesterday) {
    return `Yesterday, ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
           `, ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
}
