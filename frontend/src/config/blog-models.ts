import type { ModelViewConfig } from "@/components/core/views/shared/model-view-config";

export const blogModelConfig: ModelViewConfig = {
  model: "Blogs", accessKey: "blogs", route: "/web/blogs", title: "Blogs", singularTitle: "Blog",
  description: "Write, organize, and publish articles for your website.", labelField: "title", subtitleField: "subtitle",
  breadcrumbs: [{ label: "Apps", href: "/web" }],
  slug: { source: "title", field: "slug", availabilityEndpoint: "/blogs/slug-availability" },
  publicPath: { base: "/blog", categoryField: "categoryId", categoryModel: "BlogCategory", categorySlugField: "slug" },
  images: [
    { field: "coverImage", presentField: "hasCoverImage", endpoint: "/blogs/{id}/images/cover" },
    { field: "ogImage", presentField: "hasOgImage", endpoint: "/blogs/{id}/images/og-image" },
  ],
  writableFields: ["title", "subtitle", "slug", "categoryId", "contentHtml", "metaTitle", "metaDescription", "metaKeywords", "published"],
  search: {
    placeholder: "Search blogs...", defaultView: "list",
    searchableFields: ["title", "subtitle", "slug", "metaTitle", "metaDescription", "metaKeywords"].map(name => ({ name, label: ({ metaTitle: "Meta Title", metaDescription: "Meta Description", metaKeywords: "Keywords" } as Record<string, string>)[name] ?? name.charAt(0).toUpperCase() + name.slice(1) })),
    filterOptions: [
      { id: "published", label: "Published", field: "published", operator: "=", value: true },
      { id: "draft", label: "Draft", field: "published", operator: "=", value: false },
      { id: "no-category", label: "No Category", field: "categoryId", operator: "=", value: null },
    ],
  },
  list: { order: "updatedAt desc", pageSize: 24, fields: [
    { name: "hasCoverImage", label: "Cover", kind: "image", imageEndpoint: "/blogs/{id}/images/cover", className: "w-20" },
    { name: "title", label: "Title", primary: true, className: "min-w-56 max-w-80" },
    { name: "subtitle", label: "Subtitle", className: "min-w-48 max-w-72" },
    { name: "slug", label: "URL / Slug", className: "min-w-48" },
    { name: "categoryId", label: "Category", kind: "relation", className: "min-w-32" },
    { name: "published", label: "Published", kind: "status", trueLabel: "Published", falseLabel: "Draft" },
    { name: "publishedAt", label: "Published At", kind: "date" },
    { name: "updatedAt", label: "Updated At", kind: "date" },
  ] },
  form: {
    defaults: { title: "", subtitle: "", slug: "", categoryId: null, coverImage: null, ogImage: null, contentHtml: "", metaTitle: "", metaDescription: "", metaKeywords: [], published: false },
    sections: [{ id: "content", title: "Blog content", description: "The title and URL identify your article. Existing URLs stay stable when you edit the title.", fields: [
      { name: "published", label: "Publication status", widget: "toggle", trueLabel: "Published", falseLabel: "Unpublished", colSpan: 2, helpText: "Turn on to publish, or turn off to unpublish. Click Save to apply your change." },
      { name: "title", label: "Title", widget: "text", required: true, autoFocus: true, colSpan: 2 },
      { name: "subtitle", label: "Subtitle", widget: "text", colSpan: 2 },
      { name: "slug", label: "URL", widget: "text", prefix: "/blog/", required: true, colSpan: 2, helpText: "Only the final URL segment is editable. A selected category is inserted into the public URL automatically." },
      { name: "categoryId", label: "Category", widget: "select", emptyLabel: "No Category", colSpan: 2, relation: { model: "BlogCategory", labelField: "name", domain: [["active", "=", true]], order: "name asc" } },
      { name: "coverImage", label: "Cover image", widget: "cover-image", colSpan: 2, imageMaxSizeMb: 5 },
      { name: "contentHtml", label: "Content", widget: "html", colSpan: 2, helpText: "Enter HTML. Headings, paragraphs, links and tables are supported; scripts and unsafe markup are removed on save." },
    ] }],
    notebooks: [
      { id: "seo", label: "SEO & Social", sections: [{ id: "seo-fields", fields: [
        { name: "metaTitle", label: "Meta Title", widget: "text", colSpan: 2, helpText: "Used as the search result/page title. Falls back to the Blog title." },
        { name: "metaDescription", label: "Meta Description", widget: "textarea", colSpan: 2, helpText: "Short summary for search engines and social previews." },
        { name: "metaKeywords", label: "Meta Keywords", widget: "tags", colSpan: 2, helpText: "Optional content keywords." },
        { name: "ogImage", label: "OG image", widget: "image", colSpan: 2, imageMaxSizeMb: 2, helpText: "Optional social preview. Falls back to the cover image." },
      ] }] },
      { id: "publishing", label: "Publishing", sections: [{ id: "publishing-fields", fields: [
        { name: "publishedAt", label: "First published", widget: "text", readonly: true, helpText: "Set on first publication and preserved when republishing." },
      ] }] },
    ],
  },
};

export const blogCategoryModelConfig: ModelViewConfig = {
  model: "BlogCategory", accessKey: "blogs", route: "/web/blogs/categories", title: "Blog Categories", singularTitle: "Category",
  description: "Organize articles with optional categories.", labelField: "name", archiveField: "active",
  breadcrumbs: [{ label: "Blogs", href: "/web/blogs" }], slug: { source: "name", field: "slug" },
  writableFields: ["name", "slug", "description", "active"],
  search: { placeholder: "Search categories...", defaultView: "list", searchableFields: [{ name: "name", label: "Name" }, { name: "slug", label: "Slug" }], filterOptions: [
    { id: "active", label: "Active", field: "active", operator: "=", value: true },
    { id: "archived", label: "Archived", field: "active", operator: "=", value: false },
  ] },
  list: { order: "name asc", fields: [
    { name: "name", label: "Name", primary: true }, { name: "slug", label: "Slug" },
    { name: "active", label: "Active", kind: "status" }, { name: "updatedAt", label: "Updated At", kind: "date" },
  ] },
  form: { defaults: { name: "", slug: "", description: "", active: true }, sections: [{ id: "general", title: "Category", fields: [
    { name: "name", label: "Name", widget: "text", required: true, autoFocus: true },
    { name: "slug", label: "Slug", widget: "text", required: true },
    { name: "description", label: "Description", widget: "textarea", colSpan: 2 },
    { name: "active", label: "Active", widget: "switch" },
  ] }] },
};
