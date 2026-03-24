/**
 * Strip HTML tags from a string and decode common HTML entities
 * @param {string} str - The HTML string to strip
 * @returns {string} - Plain text without HTML tags
 */
export function stripHtml(str) {
  if (!str || typeof str !== 'string') return str;
  
  return str
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&times;/g, '\u00d7') // Replace multiplication sign
    .replace(/&amp;/g, '&') // Replace ampersand
    .replace(/&lt;/g, '<') // Replace less than
    .replace(/&gt;/g, '>') // Replace greater than
    .replace(/&quot;/g, '"') // Replace quote
    .replace(/&#39;/g, "'") // Replace apostrophe
    .replace(/&hellip;/g, '…') // Replace ellipsis
    .replace(/&rdquo;/g, '"') // Replace right double quote
    .replace(/&ldquo;/g, '"') // Replace left double quote
    .replace(/&rsquo;/g, '') // Replace right single quote
    .replace(/&lsquo;/g, '') // Replace left single quote
    .replace(/&mdash;/g, '—') // Replace em dash
    .replace(/&ndash;/g, '–') // Replace en dash
    .replace(/&bull;/g, '•') // Replace bullet
    .replace(/&reg;/g, '®') // Replace registered trademark
    .replace(/&copy;/g, '©') // Replace copyright
    .replace(/&trade;/g, '™') // Replace trademark
    .replace(/&euro;/g, '€') // Replace euro
    .replace(/&pound;/g, '£') // Replace pound
    .replace(/&yen;/g, '¥') // Replace yen
    .replace(/&cent;/g, '¢') // Replace cent
    .replace(/&deg;/g, '°') // Replace degree
    .replace(/&plusmn;/g, '±') // Replace plus-minus
    .replace(/&micro;/g, 'µ') // Replace micro
    .replace(/&para;/g, '¶') // Replace paragraph
    .replace(/&sect;/g, '§') // Replace section
    .trim();
}

/**
 * Recursively strip HTML from all string properties in an object
 * @param {any} obj - Object to process
 * @param {string[]} fields - Array of field names to strip HTML from
 * @returns {any} - Object with HTML stripped from specified fields
 */
export function stripHtmlFromFields(obj, fields) {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => stripHtmlFromFields(item, fields));
  }
  
  const result = { ...obj };
  
  for (const field of fields) {
    if (field in result && typeof result[field] === 'string') {
      result[field] = stripHtml(result[field]);
    }
  }
  
  return result;
}