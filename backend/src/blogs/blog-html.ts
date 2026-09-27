import sanitizeHtml from 'sanitize-html';

const color = [
  /^#[\da-f]{3}(?:[\da-f]{3})?$/i,
  /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i,
];

function allowedImageSource(source: string) {
  return (
    /^\/editor-media\/[a-f\d]{24}$/.test(source) ||
    /^\/editor-icons\/(?:star|heart|check|info|code|globe)$/.test(source) ||
    // Preserve external images and the existing cover/OG image URLs.
    /^https?:\/\//i.test(source) ||
    /^\/blog-images\/[a-f\d]{24}\/(?:cover|og-image)(?:\?[^\s]*)?$/.test(source)
  );
}

export function sanitizeBlogHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'br',
      'hr',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'a',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'table',
      'colgroup',
      'col',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'figure',
      'figcaption',
      'img',
      'span',
      'div',
    ],
    allowedAttributes: {
      '*': ['style', 'class'],
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      th: ['colspan', 'rowspan', 'scope'],
      td: ['colspan', 'rowspan'],
    },
    allowedClasses: {
      '*': [
        'editor-icon',
        /^editor-columns-[234]$/,
        /^editor-banner-(?:info|success|warning|danger)$/,
      ],
    },
    allowedStyles: {
      '*': {
        color,
        'background-color': color,
        'font-weight': [/^(?:normal|bold|400|500|600|700)$/],
        'font-style': [/^(?:normal|italic)$/],
        'text-decoration': [
          /^(?:none|underline|line-through|underline line-through)$/,
        ],
        'text-align': [/^(?:left|center|right|justify)$/],
        'font-family': [/^(?:Arial|Georgia|Verdana|Tahoma|monospace)$/i],
        'font-size': [/^(?:[89]|[1-9]\d|1[01]\d|120)px$/],
        'margin-left': [/^(?:0|[1-9]\d?|1\d\d|2[0-3]\d|240)px$/],
      },
      col: { width: [/^(?:\d{1,2}(?:\.\d{1,3})?|100)%$/] },
      tr: { height: [/^(?:2[89]|[3-9]\d|[1-9]\d{2}|1000)px$/] },
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        if (attribs.target === '_blank') attribs.rel = 'noopener noreferrer';
        else {
          delete attribs.target;
          delete attribs.rel;
        }
        return { tagName, attribs };
      },
    },
    exclusiveFilter: (frame) =>
      frame.tag === 'img' && !allowedImageSource(frame.attribs.src ?? ''),
  });
}

/** References are derived only from canonical, sanitized HTML, never client metadata. */
export function extractBlogAttachmentIds(html: string): string[] {
  return [
    ...new Set(
      Array.from(
        html.matchAll(/<img\b[^>]*\bsrc="\/editor-media\/([a-f\d]{24})"/g),
        (match) => match[1],
      ),
    ),
  ];
}
export function blogExcerpt(html: string): string {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
}
