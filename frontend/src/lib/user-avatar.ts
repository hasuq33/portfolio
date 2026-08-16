const avatarColors = [
  "bg-blue-500 text-white",
  "bg-violet-500 text-white",
  "bg-emerald-500 text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-cyan-600 text-white",
  "bg-fuchsia-500 text-white",
  "bg-indigo-500 text-white",
];

export function getUserInitial(name?: string, login?: string) {
  return (name?.trim() || login?.trim() || "U").charAt(0).toUpperCase();
}

export function getUserAvatarColor(name?: string, login?: string) {
  const seed = name?.trim() || login?.trim() || "User";
  const hash = Array.from(seed).reduce((total, character) => total + character.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length];
}

export function getUserAvatarUrl(userId: string, version?: number) {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  const suffix = version ? `?v=${version}` : "";
  return `${baseUrl}/users/${userId}/avatar${suffix}`;
}
