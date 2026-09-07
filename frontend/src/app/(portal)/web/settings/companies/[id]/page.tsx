import { ModelWorkspace } from "@/components/core/views/shared/ModelWorkspace";
import { companyModelConfig } from "@/config/erp-models";

interface CompanyFormPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ readonly?: string | string[] }>;
}

export default async function CompanyFormPage({ params, searchParams }: CompanyFormPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const readonlyValue = Array.isArray(query.readonly) ? query.readonly[0] : query.readonly;

  return (
    <ModelWorkspace
      config={companyModelConfig}
      recordId={id}
      readonly={readonlyValue === "1" || readonlyValue === "true"}
    />
  );
}
