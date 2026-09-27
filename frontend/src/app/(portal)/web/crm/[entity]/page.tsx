"use client";
import { use } from "react";
import { notFound } from "next/navigation";
import { ModelWorkspace } from "@/components/core/views/shared/ModelWorkspace";
import { crmConfigs } from "@/config/crm-models";

export default function CrmListPage({
  params,
}: {
  params: Promise<{ entity: string }>;
}) {
  const { entity } = use(params);
  const config = Object.hasOwn(crmConfigs, entity)
    ? crmConfigs[entity]
    : undefined;
  if (!config) notFound();
  return <ModelWorkspace key={entity} config={config} />;
}
