import { ModelWorkspace } from "@/components/core/views/shared/ModelWorkspace";
import { groupModelConfig } from "@/config/erp-models";

interface GroupFormPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ readonly?: string | string[] }>;
}

export default async function GroupFormPage({ params, searchParams }: GroupFormPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const readonlyValue = Array.isArray(query.readonly) ? query.readonly[0] : query.readonly;

  return (
    <ModelWorkspace
      config={groupModelConfig}
      recordId={id}
      readonly={readonlyValue === "1" || readonlyValue === "true"}
    />
  );
}
