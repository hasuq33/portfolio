"use client";
import { use } from "react";
import { ModelWorkspace } from "@/components/core/views/shared/ModelWorkspace";
import { blogCategoryModelConfig } from "@/config/blog-models";
export default function CategoryFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ModelWorkspace config={blogCategoryModelConfig} recordId={id} />;
}
