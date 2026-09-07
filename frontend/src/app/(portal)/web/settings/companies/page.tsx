import { ModelWorkspace } from "@/components/core/views/shared/ModelWorkspace";
import { companyModelConfig } from "@/config/erp-models";

export default function CompaniesPage() {
  return <ModelWorkspace config={companyModelConfig} />;
}
