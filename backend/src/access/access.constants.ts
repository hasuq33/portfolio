export const MENU_ITEM_IDS = [
  'chat',
  'dashboard',
  'crm',
  'sales',
  'projects',
  'hr',
  'blogs',
  'settings',
  'users',
  'companies',
  'groups',
] as const;

export type MenuItemId = (typeof MENU_ITEM_IDS)[number];

export const MODEL_ACCESS_KEYS = [
  'users',
  'companies',
  'groups',
  'partners',
  'leads',
  'tags',
  'blogs',
  'settings',
] as const;

export type ModelAccessKey = (typeof MODEL_ACCESS_KEYS)[number];
export type ModelPermission = 'read' | 'create' | 'write' | 'delete';

export const MODEL_NAME_TO_ACCESS_KEY: Record<string, ModelAccessKey> = {
  User: 'users',
  Company: 'companies',
  Group: 'groups',
  Partner: 'partners',
  Lead: 'leads',
  Tags: 'tags',
  Blogs: 'blogs',
  BlogCategory: 'blogs',
  'ir.configuration': 'settings',
};

export const ADMIN_MODEL_ACCESS = MODEL_ACCESS_KEYS.map((model) => ({
  model,
  read: true,
  create: true,
  write: true,
  delete: true,
}));
