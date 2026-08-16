import { UsersWorkspace } from "@/components/core/views/userView/UsersWorkspace";

interface UserFormPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ readonly?: string | string[] }>;
}

export default async function UserFormPage({ params, searchParams }: UserFormPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const readonlyValue = Array.isArray(query.readonly) ? query.readonly[0] : query.readonly;

  return <UsersWorkspace recordId={id} readonly={readonlyValue === "1" || readonlyValue === "true"} />;
}
