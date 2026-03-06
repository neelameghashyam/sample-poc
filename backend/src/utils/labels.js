import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const labelsData = require('./labels.json');

// Java MessageFormat-style interpolation: {0}, {1}, ...
function messageFormat(pattern, args) {
  if (!args || args.length === 0) return pattern;
  let result = pattern;
  for (let i = 0; i < args.length; i++) {
    result = result.replace(new RegExp(`\\{${i}\\}`, 'g'), args[i] ?? '');
  }
  return result;
}

export class LabelService {
  constructor(lang = 'en') {
    const supported = ['en', 'fr', 'de', 'es'];
    this.lang = supported.includes(lang) ? lang : 'en';
    this.labels = labelsData[this.lang] || labelsData['en'];
    this.fallback = labelsData['en'];
  }

  getPureLabel(key) {
    const val = this.labels[key] ?? this.fallback[key];
    if (val === undefined) return `missing label: ${key}`;
    return val;
  }

  getLabel(key, ...args) {
    const pattern = this.getPureLabel(key);
    if (pattern.startsWith('missing label:')) return pattern;
    const formatted = messageFormat(pattern, args);
    // Java uses '' for literal quote in MessageFormat
    return formatted.replace(/''/g, "'");
  }
}