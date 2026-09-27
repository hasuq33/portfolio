/** Shared visual-regression sample; never persisted as a blog record. */
export const richContentFixture = `<h1>Ideas deserve a clear voice</h1>
<p>A consistent article should feel natural in the editor and on the website. This paragraph includes <strong>bold emphasis</strong>, <em>italic text</em>, <u>an underline</u>, and <s>an earlier revision</s>.</p>
<p>Explore the <a href="/blog" title="Read more articles">blog archive</a>, try <code>const theme = "system";</code>, or keep an important <span style="background-color: #fef08a">highlighted idea</span> in view. <span style="color: #3586c0">This custom blue must stay blue.</span></p>
<h2>A practical writing workflow</h2>
<p>Clear structure helps readers find the details that matter.</p>
<ul><li>Start with the essential idea<ul><li>Add useful supporting context</li></ul></li><li>Keep the language approachable</li></ul>
<ol><li>Draft the content</li><li>Review it in both themes</li></ol>
<blockquote><p>Good typography supports the message without drawing attention to itself.</p></blockquote>
<hr>
<h3>A compact comparison</h3>
<table><tbody><tr><th>Capability</th><th>Result</th></tr><tr><td>Shared content styling</td><td>Consistent in every view</td></tr></tbody></table>
<h3>A wider planning table</h3>
<table><colgroup><col style="width: 25%"><col style="width: 15%"><col style="width: 20%"><col style="width: 20%"><col style="width: 20%"></colgroup><tbody><tr><th>Milestone</th><th>Owner</th><th>Schedule</th><th>Progress</th><th>Next step</th></tr><tr style="height: 68px"><td>Content foundation</td><td>Editorial</td><td>This week</td><td>Ready for review</td><td>Check responsive layout</td></tr><tr><td>Website publishing</td><td>Product</td><td>Next week</td><td>In progress</td><td>Review final article</td></tr></tbody></table>
<h3>Code stays readable</h3>
<pre><code>function publish(article) {
  return { ...article, status: "published", reviewed: true, theme: "Works in light and dark, even when the line is longer than the mobile viewport" };
}</code></pre>
<figure style="text-align: center"><img src="/editor-icons/globe" alt="A globe illustration" width="120" height="120"><figcaption>A responsive image, with a secondary caption.</figcaption></figure>
<h4>Custom formatting remains yours</h4>
<p style="text-align: right"><span style="font-family: Georgia; font-size: 24px; color: #3586c0">An intentionally customized line.</span></p>
<p><span style="color: #9333ea"><span style="background-color: #fef08a">Explicit color on a parent is preserved.</span></span> <span style="background-color: #111827; color: #ffffff">Custom dark highlight.</span></p>
<h5>Secondary heading</h5><p>Comfortable spacing without oversized elements.</p><h6>Final detail</h6><p>Semantic content remains portable.</p>`;
