"use client";
import { use } from "react";
import { notFound } from "next/navigation";
import { ModelWorkspace } from "@/components/core/views/shared/ModelWorkspace";
import { crmConfigs } from "@/config/crm-models";

export default function CrmFormPage({
  params,
}: {
  params: Promise<{ entity: string; id: string }>;
}) {
  const { entity, id } = use(params);
  const config = Object.hasOwn(crmConfigs, entity)
    ? crmConfigs[entity]
    : undefined;
  if (!config || (id !== "new" && !/^[a-f\d]{24}$/i.test(id))) notFound();
  return <ModelWorkspace key={entity} config={config} recordId={id} />;
}
