"use client";

import { useMemo } from "react";
import { BadgeCheck, Building2, Mail, Phone, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { KanbanView } from "@/components/core/views/shared/KanbanView";
import { ListView } from "@/components/core/views/shared/ListView";
import { ListColumn } from "@/components/core/views/shared/types";
import { getUserAvatarColor, getUserAvatarUrl, getUserInitial } from "@/lib/user-avatar";

export interface UserRecord {
  _id: string;
  login: string;
  name?: string;
  avatar_image?: string | File | null;
  hasAvatar?: boolean;
  email: string;
  companyName: string;
  phone?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  password?: string;
  status: "active" | "inactive";
  tags: string[];
  isVerified: boolean;
  website?: string;
  jobTitle?: string;
  department?: string;
  language?: string;
  timezone?: string;
  joinedAt?: string;
  createdAt?: string;
  [key: string]: unknown;
}

interface UserViewProps {
  users: UserRecord[];
  loading: boolean;
  activeView: "list" | "kanban";
  groupBy?: string | null;
  onOpenUser: (user: UserRecord) => void;
}

const displayName = (user: UserRecord) => user.name?.trim() || user.login;

const StatusBadge = ({ status }: { status: UserRecord["status"] }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
    status === "active"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : "bg-muted text-muted-foreground"
  }`}>
    <span className={`mr-1.5 size-1.5 rounded-full ${status === "active" ? "bg-emerald-500" : "bg-muted-foreground"}`} />
    {status === "active" ? "Active" : "Inactive"}
  </span>
);

const UserAvatar = ({ user, large = false }: { user: UserRecord; large?: boolean }) => {
  const avatarSrc = user.hasAvatar ? getUserAvatarUrl(user._id) : undefined;
  const fallbackColor = getUserAvatarColor(user.name, user.login);

  return (
    <Avatar className={large ? "size-16 ring-4 ring-background shadow-md" : "size-10"}>
      {avatarSrc && <AvatarImage src={avatarSrc} alt={`${displayName(user)} profile`} className="object-cover" />}
      <AvatarFallback className={`${fallbackColor} ${large ? "text-lg font-semibold" : "font-medium"}`}>
        {getUserInitial(user.name, user.login)}
      </AvatarFallback>
    </Avatar>
  );
};

const listColumns: ListColumn<UserRecord>[] = [
  {
    id: "user",
    label: "User",
    render: (user) => (
      <div className="flex min-w-56 items-center gap-3">
        <UserAvatar user={user} />
        <div className="min-w-0">
          <p className="truncate font-medium">{displayName(user)}</p>
          <p className="truncate text-xs text-muted-foreground">@{user.login}</p>
        </div>
      </div>
    ),
  },
  {
    id: "contact",
    label: "Contact",
    render: (user) => (
      <div className="min-w-48">
        <p className="truncate">{user.email}</p>
        <p className="truncate text-xs text-muted-foreground">{user.phone || "No phone number"}</p>
      </div>
    ),
  },
  {
    id: "company",
    label: "Company",
    render: (user) => <span className="line-clamp-1 min-w-32">{user.companyName || "—"}</span>,
  },
  {
    id: "status",
    label: "Status",
    render: (user) => <StatusBadge status={user.status} />,
  },
  {
    id: "verified",
    label: "Verified",
    render: (user) => user.isVerified
      ? <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400"><BadgeCheck className="size-4" /> Verified</span>
      : <span className="text-xs text-muted-foreground">Not verified</span>,
  },
];

const UserCard = ({ user }: { user: UserRecord }) => (
  <Card className="h-full gap-4 overflow-hidden py-0 transition-shadow hover:shadow-md">
    <CardHeader className="relative gap-3 bg-gradient-to-br from-primary/10 via-muted/30 to-background px-5 pb-4 pt-5">
      <div className="absolute right-4 top-4"><StatusBadge status={user.status} /></div>
      <UserAvatar user={user} large />
      <div className="min-w-0 pt-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate font-semibold">{displayName(user)}</h3>
          {user.isVerified && <BadgeCheck className="size-4 shrink-0 text-blue-500" aria-label="Verified user" />}
        </div>
        <p className="truncate text-sm text-muted-foreground">@{user.login}</p>
      </div>
    </CardHeader>
    <CardContent className="space-y-3 px-5 pb-5">
      <div className="flex items-center gap-2 text-sm"><Mail className="size-4 shrink-0 text-muted-foreground" /><span className="truncate">{user.email}</span></div>
      <div className="flex items-center gap-2 text-sm"><Building2 className="size-4 shrink-0 text-muted-foreground" /><span className="truncate">{user.companyName || "No company"}</span></div>
      <div className="flex items-center gap-2 text-sm"><Phone className="size-4 shrink-0 text-muted-foreground" /><span className="truncate text-muted-foreground">{user.phone || "No phone number"}</span></div>
      {user.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {user.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{tag}</span>)}
          {user.tags.length > 3 && <span className="px-1 py-0.5 text-xs text-muted-foreground">+{user.tags.length - 3}</span>}
        </div>
      )}
    </CardContent>
  </Card>
);

export default function UserView({
  users,
  loading,
  activeView,
  groupBy,
  onOpenUser,
}: UserViewProps) {
  const groups = useMemo(() => {
    if (!groupBy || !users.length) return [{ key: "all", label: null, records: users }];

    const grouped = new Map<string, UserRecord[]>();
    users.forEach((user) => {
      const value = user[groupBy];
      const key = Array.isArray(value) ? value.join(", ") : String(value || "Not set");
      grouped.set(key, [...(grouped.get(key) ?? []), user]);
    });

    return Array.from(grouped, ([key, records]) => ({
      key,
      label: groupBy === "isVerified" ? (key === "true" ? "Verified" : "Not verified") : key,
      records,
    }));
  }, [groupBy, users]);

  if (loading) {
    return (
      <div className={activeView === "kanban" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-2 rounded-xl border p-4"}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={activeView === "kanban" ? "h-64 animate-pulse rounded-xl bg-muted" : "h-14 animate-pulse rounded-lg bg-muted"} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.key} className="space-y-3">
          {group.label && (
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-muted-foreground" />
              <h2 className="font-semibold capitalize">{group.label}</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{group.records.length}</span>
            </div>
          )}
          {activeView === "kanban" ? (
            <KanbanView
              records={group.records}
              getRecordId={(user) => user._id}
              onOpenRecord={onOpenUser}
              renderCard={(user) => <UserCard user={user} />}
              emptyTitle="No users found"
            />
          ) : (
            <ListView
              records={group.records}
              columns={listColumns}
              getRecordId={(user) => user._id}
              onOpenRecord={onOpenUser}
              emptyTitle="No users found"
            />
          )}
        </section>
      ))}
    </div>
  );
}
