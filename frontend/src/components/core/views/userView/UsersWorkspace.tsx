"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/core/views/shared/PaginationControls";
import { FormViewSkeleton } from "@/components/core/views/shared/FormView";
import { useViewSearch } from "@/context/ViewSearchContext";
import { useUser } from "@/context/UserContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { apiFetch } from "@/lib/orm_service";
import { getUserAvatarUrl } from "@/lib/user-avatar";
import {
  filtersToDomain,
  ViewSearchConfig,
} from "@/components/web/search-status-bar.types";
import UserView, { UserRecord } from "./userView";
import { UserFormView } from "./UserFormView";

const userSearchConfig: ViewSearchConfig = {
  placeholder: "Search users...",
  searchableFields: [
    { name: "name", label: "Name" },
    { name: "login", label: "Login" },
    { name: "email", label: "Email" },
    { name: "companyName", label: "Company" },
    { name: "phone", label: "Phone" },
    { name: "tags", label: "Tags" },
  ],
  filterOptions: [
    { id: "active", label: "Active users", field: "status", operator: "=", value: "active" },
    { id: "verified", label: "Verified users", field: "isVerified", operator: "=", value: true },
  ],
  groupByOptions: [
    { value: "status", label: "Status" },
    { value: "companyName", label: "Company" },
    { value: "isVerified", label: "Verification" },
  ],
  viewOptions: [
    { value: "list", label: "List view" },
    { value: "kanban", label: "Kanban view" },
  ],
  defaultView: "list",
};

const listFields = [
  "_id", "login", "name", "hasAvatar", "email", "companyName", "phone",
  "status", "tags", "isVerified", "website", "joinedAt", "createdAt",
];

const newUser = (): UserRecord => ({
  _id: "new",
  login: "",
  name: "",
  avatar_image: null,
  hasAvatar: false,
  email: "",
  companyName: "",
  phone: "",
  website: "",
  address: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  jobTitle: "",
  department: "",
  language: "en",
  timezone: "Asia/Kolkata",
  password: "",
  status: "active",
  tags: [],
  isVerified: false,
  joinedAt: "",
});

interface SearchResponse {
  records: UserRecord[];
  total: number;
  limit: number;
  offset: number;
}

interface AdjacentUser {
  _id: string;
  name?: string;
  login?: string;
}

interface UserRecordNavigation {
  previous: AdjacentUser | null;
  next: AdjacentUser | null;
}

interface UserSaveErrorResponse {
  message?: string;
  errors?: Array<{ field?: string; message?: string }>;
  fields?: string[];
}

interface UsersWorkspaceProps {
  recordId?: string;
  readonly?: boolean;
}

const normalizeUser = (user: UserRecord, avatarVersion?: number): UserRecord => ({
  ...user,
  avatar_image: user.hasAvatar ? getUserAvatarUrl(user._id, avatarVersion) : null,
  status: user.status ?? "active",
  tags: user.tags ?? [],
  isVerified: user.isVerified ?? false,
  password: "",
  joinedAt: user.joinedAt ? String(user.joinedAt).slice(0, 10) : "",
});

const validateUser = (user: UserRecord, isNew: boolean) => {
  const errors: Record<string, string> = {};
  if (!user.login?.trim()) errors.login = "Login is required.";
  if (!user.email?.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!user.companyName?.trim()) errors.companyName = "Company is required.";
  if (isNew && !user.password?.trim()) errors.password = "Password is required for a new user.";
  return errors;
};

const focusFirstError = (errors: Record<string, string>) => {
  const firstField = Object.keys(errors)[0];
  if (!firstField) return;
  requestAnimationFrame(() => document.getElementById(firstField)?.focus());
};

export function UsersWorkspace({ recordId, readonly = false }: UsersWorkspaceProps) {
  const router = useRouter();
  const { user: currentUser, refreshUser } = useUser();
  const { state: searchState, configure, reset } = useViewSearch();
  const debouncedQuery = useDebouncedValue(searchState.query, 300);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(24);
  const [loading, setLoading] = useState(!recordId);
  const [formLoading, setFormLoading] = useState(Boolean(recordId));
  const [formData, setFormData] = useState<UserRecord | null>(null);
  const [originalFormData, setOriginalFormData] = useState<UserRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [recordNavigation, setRecordNavigation] = useState<UserRecordNavigation | null>(null);

  useEffect(() => {
    configure(userSearchConfig);
    return reset;
  }, [configure, reset]);

  useEffect(() => {
    setOffset(0);
  }, [debouncedQuery, searchState.filters, searchState.searchField]);

  useEffect(() => {
    if (recordId) return;
    let ignore = false;

    const loadUsers = async () => {
      setLoading(true);
      const searchFields = searchState.searchField
        ? [searchState.searchField]
        : userSearchConfig.searchableFields?.map((field) => field.name) ?? [];
      const response = await apiFetch({
        url: "/api/User/search",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        payload: JSON.stringify({
          fields: listFields,
          order: "name asc, login asc",
          limit,
          offset,
          domain: filtersToDomain(searchState.filters),
          search: { query: debouncedQuery, fields: searchFields },
          withCount: true,
        }),
      });

      if (!ignore && response?.ok) {
        const result = await response.json() as SearchResponse;
        setUsers(result.records.map(normalizeUser));
        setTotal(result.total);

        if (result.total > 0 && offset >= result.total) {
          setOffset(Math.floor((result.total - 1) / limit) * limit);
        }
      }
      if (!ignore) setLoading(false);
    };

    void loadUsers();
    return () => { ignore = true; };
  }, [debouncedQuery, limit, offset, recordId, searchState.filters, searchState.searchField]);

  useEffect(() => {
    if (!recordId) {
      setFormData(null);
      setOriginalFormData(null);
      setRecordNavigation(null);
      setFormLoading(false);
      setFieldErrors({});
      setFormError(undefined);
      return;
    }

    if (recordId === "new") {
      const draft = newUser();
      setFormData(draft);
      setOriginalFormData(draft);
      setRecordNavigation(null);
      setFormLoading(false);
      setFieldErrors({});
      setFormError(undefined);
      return;
    }

    let ignore = false;
    const loadUser = async () => {
      setFormLoading(true);
      setFieldErrors({});
      setFormError(undefined);
      const [response, navigationResponse] = await Promise.all([
        apiFetch({ url: `/users/${recordId}`, method: "GET" }),
        apiFetch({ url: `/users/${recordId}/navigation`, method: "GET" }),
      ]);
      if (!ignore && response?.ok) {
        const user = normalizeUser(await response.json() as UserRecord);
        setFormData(user);
        setOriginalFormData(user);
      }
      if (!ignore && navigationResponse?.ok) {
        setRecordNavigation(await navigationResponse.json() as UserRecordNavigation);
      }
      if (!ignore) setFormLoading(false);
    };

    void loadUser();
    return () => { ignore = true; };
  }, [recordId]);

  const formDirty = useMemo(
    () => Boolean(formData && originalFormData && JSON.stringify(formData) !== JSON.stringify(originalFormData)),
    [formData, originalFormData],
  );

  const saveUser = async () => {
    if (!formData || readonly) return;
    const validationErrors = validateUser(formData, recordId === "new");
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setFormError(undefined);
      focusFirstError(validationErrors);
      return;
    }

    setSaving(true);
    setFieldErrors({});
    setFormError(undefined);
    try {
      const avatarValue = formData.avatar_image;
      const hadAvatar = Boolean(originalFormData?.hasAvatar);
      const { _id, createdAt, updatedAt, __v, ...payload } = formData;

      delete payload.avatar_image;
      delete payload.hasAvatar;
      if (!payload.joinedAt) delete payload.joinedAt;
      if (recordId !== "new" && !payload.password) delete payload.password;

      const response = await apiFetch({
        url: recordId === "new" ? "/users" : `/users/${recordId}`,
        method: recordId === "new" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        payload: JSON.stringify(payload),
        suppressGlobalError: true,
      });

      if (!response) {
        setFormError("The user could not be saved because the server is unavailable.");
        return;
      }

      if (!response.ok) {
        let errorResponse: UserSaveErrorResponse = {};
        try {
          errorResponse = await response.json() as UserSaveErrorResponse;
        } catch {
          // Use the fallback form message when the response is not JSON.
        }

        const serverFieldErrors = Object.fromEntries(
          (errorResponse.errors ?? [])
            .filter((error): error is { field: string; message: string } => Boolean(error.field && error.message))
            .map((error) => [error.field, error.message]),
        );
        for (const field of errorResponse.fields ?? []) {
          serverFieldErrors[field] = errorResponse.message ?? "This value is already in use.";
        }

        if (Object.keys(serverFieldErrors).length > 0) {
          setFieldErrors(serverFieldErrors);
          focusFirstError(serverFieldErrors);
        } else {
          setFormError(errorResponse.message ?? "The user could not be saved. Review the form and try again.");
        }
        return;
      }

      const serverUser = await response.json() as UserRecord;
      const savedId = serverUser._id;
      let finalHasAvatar = Boolean(serverUser.hasAvatar);
      let avatarVersion: number | undefined;
      let avatarChangeSucceeded = true;

      if (typeof File !== "undefined" && avatarValue instanceof File) {
        const imagePayload = new FormData();
        imagePayload.append("file", avatarValue);
        const avatarResponse = await apiFetch({
          url: `/users/${savedId}/avatar`,
          method: "PUT",
          payload: imagePayload,
        });
        avatarChangeSucceeded = Boolean(avatarResponse?.ok);
        if (avatarChangeSucceeded) {
          finalHasAvatar = true;
          avatarVersion = Date.now();
        }
      } else if (avatarValue === null && hadAvatar) {
        const avatarResponse = await apiFetch({
          url: `/users/${savedId}/avatar`,
          method: "DELETE",
        });
        avatarChangeSucceeded = Boolean(avatarResponse?.ok);
        if (avatarChangeSucceeded) finalHasAvatar = false;
      }

      const savedUser = normalizeUser({ ...serverUser, hasAvatar: finalHasAvatar }, avatarVersion);
      setOriginalFormData(savedUser);
      setFormData(avatarChangeSucceeded ? savedUser : { ...savedUser, avatar_image: avatarValue });
      setFieldErrors({});
      setFormError(avatarChangeSucceeded
        ? undefined
        : "The user details were saved, but the profile image change could not be completed. Try saving the image again.");
      if (avatarChangeSucceeded && currentUser?._id === savedId) await refreshUser();
      if (recordId === "new") router.replace(`/web/settings/users/${savedUser._id}`);
    } finally {
      setSaving(false);
    }
  };

  const openFormRecord = (id: string) => {
    router.push(`/web/settings/users/${id}${readonly ? "?readonly=true" : ""}`);
  };

  if (recordId) {
    return (
      <main className="mx-auto w-full max-w-7xl p-3 sm:p-5 lg:p-6">
        {formLoading ? (
          <FormViewSkeleton />
        ) : formData ? (
          <UserFormView
            user={formData}
            isNew={recordId === "new"}
            readonly={readonly}
            dirty={formDirty}
            saving={saving}
            errors={fieldErrors}
            formError={formError}
            onChange={(fieldName, value) => {
              setFormData((current) => current ? { ...current, [fieldName]: value } : current);
              setFieldErrors((current) => {
                if (!current[fieldName]) return current;
                const next = { ...current };
                delete next[fieldName];
                return next;
              });
              setFormError(undefined);
            }}
            onSave={saveUser}
            onDiscard={() => {
              if (originalFormData) setFormData(originalFormData);
              setFieldErrors({});
              setFormError(undefined);
            }}
            onClose={() => router.push("/web/settings/users")}
            recordNavigation={recordId === "new" ? undefined : {
              hasPrevious: Boolean(recordNavigation?.previous?._id),
              hasNext: Boolean(recordNavigation?.next?._id),
              onPrevious: recordNavigation?.previous?._id
                ? () => openFormRecord(String(recordNavigation.previous?._id))
                : undefined,
              onNext: recordNavigation?.next?._id
                ? () => openFormRecord(String(recordNavigation.next?._id))
                : undefined,
            }}
          />
        ) : (
          <div className="rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <p className="font-medium">User could not be loaded</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/web/settings/users")}>Back to users</Button>
          </div>
        )}
      </main>
    );
  }

  const activeView = searchState.view === "kanban" ? "kanban" : "list";

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-5 p-3 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage people who can access your workspace.</p>
        </div>
        <Button onClick={() => router.push("/web/settings/users/new")}>
          <Plus /> New User
        </Button>
      </div>

      <UserView
        users={users}
        loading={loading}
        activeView={activeView}
        groupBy={searchState.groupBy}
        onOpenUser={(user) => router.push(`/web/settings/users/${user._id}`)}
      />

      {!loading && (
        <PaginationControls
          offset={offset}
          limit={limit}
          total={total}
          onOffsetChange={setOffset}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setOffset(0);
          }}
        />
      )}
    </main>
  );
}
