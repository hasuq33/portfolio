
"use client";
import { ModelWorkspace } from "@/components/core/views/shared/ModelWorkspace";
import { blogModelConfig } from "@/config/blog-models";
export default function BlogListPage() { return <ModelWorkspace config={blogModelConfig} />; }
