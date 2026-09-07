export const MENU_ITEMS = [
  { key: "chat", label: "Chat", href: "/web/chats" },
  { key: "dashboard", label: "Dashboard", href: "/web/dashboard" },
  { key: "crm", label: "CRM", href: "/web/crm" },
  { key: "sales", label: "Sales", href: "/web/sales" },
  { key: "projects", label: "Projects", href: "/web/projects" },
  { key: "hr", label: "HR", href: "/web/employees" },
  { key: "blogs", label: "Blog", href: "/web/blogs" },
  { key: "settings", label: "Settings", href: "/web/settings" },
  { key: "users", label: "Users", href: "/web/settings/users" },
  { key: "companies", label: "Company", href: "/web/settings/companies" },
  { key: "groups", label: "Groups", href: "/web/settings/groups" },
] as const;

export type MenuItemKey = (typeof MENU_ITEMS)[number]["key"];

const menuKeys = <TKey extends MenuItemKey>(keys: readonly TKey[]) =>
  keys.map((key) => MENU_ITEMS.find((item) => item.key === key)!);

export const WEB_APP_MENU_ITEMS = menuKeys([
  "chat",
  "dashboard",
  "crm",
  "sales",
  "projects",
  "hr",
  "blogs",
  "settings",
] as const);

export const SETTINGS_MENU_ITEMS = menuKeys([
  "settings",
  "users",
  "companies",
  "groups",
] as const);

export const MENU_ACCESS_OPTIONS = MENU_ITEMS.map(({ key, label }) => ({
  value: key,
  label,
}));

export const MODEL_ACCESS_OPTIONS = [
  { value: "users", label: "Users" },
  { value: "companies", label: "Companies" },
  { value: "groups", label: "Groups" },
  { value: "partners", label: "Partners" },
  { value: "leads", label: "Leads" },
  { value: "tags", label: "Tags" },
  { value: "blogs", label: "Blogs" },
  { value: "settings", label: "Settings" },
] as const;
