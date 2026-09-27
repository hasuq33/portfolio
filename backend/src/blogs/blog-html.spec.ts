import { extractBlogAttachmentIds, sanitizeBlogHtml } from './blog-html';

describe('Custom editor HTML', () => {
  const id = '507f1f77bcf86cd799439011';
  it('preserves bounded formatting and editor layout classes', () => {
    const html = sanitizeBlogHtml(
      '<div class="editor-columns-2 arbitrary"><p style="text-align:center;position:fixed"><span style="font-weight:700;color:#2563eb">Hello</span></p></div>',
    );
    expect(html).toContain('editor-columns-2');
    expect(html).toContain('text-align:center');
    expect(html).toContain('font-weight:700');
    expect(html).toContain('color:#2563eb');
    expect(html).not.toMatch(/arbitrary|position/);
  });
  it('strips executable HTML, unsafe URLs and unbounded CSS', () => {
    const html = sanitizeBlogHtml(
      '<script>alert(1)</script><svg onload="evil()"></svg><p onclick="evil()" style="background-image:url(https://evil.test/x)">Safe<a href="javascript:evil()">link</a></p><img src="data:image/svg+xml;base64,AAAA"><iframe src="https://evil.test"></iframe>',
    );
    expect(html).not.toMatch(
      /<script|<svg|onload|onclick|javascript:|data:image|background-image|iframe|evil\.test/,
    );
    expect(html).toContain('Safe');
  });
  it('extracts only unique image references after sanitization', () => {
    const html = sanitizeBlogHtml(
      `<img src="/editor-media/${id}" onerror="evil()"><img src="/editor-media/${id}"><img class="editor-icon" src="/editor-icons/star"><p>/editor-media/507f1f77bcf86cd799439012</p>`,
    );
    expect(extractBlogAttachmentIds(html)).toEqual([id]);
    expect(html).toContain('editor-icon');
    expect(html).not.toContain('onerror');
  });
  it('rejects unknown internal media and icon URLs', () => {
    expect(
      sanitizeBlogHtml(
        '<img src="/editor-icons/unknown"><img src="/editor-media/not-an-id"><img src="//evil.test/x">',
      ),
    ).not.toContain('<img');
  });
  it('keeps existing external and cover image URLs', () => {
    expect(
      sanitizeBlogHtml(
        `<img src="https://example.com/x.png"><img src="/blog-images/${id}/cover?v=1">`,
      ),
    ).toContain('/cover?v=1');
    expect(sanitizeBlogHtml('<img src="https://example.com/x.png">')).toContain(
      'https://example.com/x.png',
    );
  });
  it('is stable across repeated save/read sanitization', () => {
    const html = sanitizeBlogHtml(
      `<h1>Title</h1><div class="editor-banner-info"><p style="text-align:right">Hello</p></div><img src="/editor-media/${id}">`,
    );
    expect(sanitizeBlogHtml(html)).toBe(html);
  });
  it('preserves editor fonts, highlights, safe links and resized table dimensions', () => {
    const input =
      '<h1>Heading</h1><p style="text-align:justify;margin-left:24px"><span style="font-family:Georgia;font-size:24px;background-color:#fef08a">Text</span><a href="/blog" target="_blank" rel="opener" title="Blog">Link</a></p><table><colgroup><col style="width:60%"><col style="width:40%"></colgroup><tbody><tr style="height:76px"><th scope="col">A</th><td>B</td></tr></tbody></table>';
    const html = sanitizeBlogHtml(input);
    for (const expected of [
      '<h1>',
      'font-family:Georgia',
      'font-size:24px',
      'background-color:#fef08a',
      'text-align:justify',
      'margin-left:24px',
      'width:60%',
      'height:76px',
      'scope="col"',
      'rel="noopener noreferrer"',
    ])
      expect(html).toContain(expected);
    expect(sanitizeBlogHtml(html)).toBe(html);
  });
  it('strips out-of-range fonts and dimensions from pasted markup', () => {
    const html = sanitizeBlogHtml(
      '<p style="font-size:999px;font-family:evil;position:fixed;margin-left:999px" onclick="alert(1)">Text</p><table><colgroup><col style="width:999%"></colgroup><tbody><tr style="height:99999px"><td>Cell</td></tr></tbody></table>',
    );
    expect(html).not.toMatch(/999|onclick|position|evil/);
    expect(html).toContain('Text');
    expect(html).toContain('<table>');
  });
});
