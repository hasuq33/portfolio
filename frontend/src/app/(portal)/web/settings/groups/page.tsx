import { ModelWorkspace } from "@/components/core/views/shared/ModelWorkspace";
import { groupModelConfig } from "@/config/erp-models";

export default function GroupsPage() {
  return <ModelWorkspace config={groupModelConfig} />;
}
