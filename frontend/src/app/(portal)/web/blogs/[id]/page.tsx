"use client";
import { use } from "react";
import { ModelWorkspace } from "@/components/core/views/shared/ModelWorkspace";
import { blogModelConfig } from "@/config/blog-models";
export default function BlogFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ModelWorkspace config={blogModelConfig} recordId={id} />;
}
