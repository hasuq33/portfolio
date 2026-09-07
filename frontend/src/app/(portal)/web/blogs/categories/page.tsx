"use client";
import { ModelWorkspace } from "@/components/core/views/shared/ModelWorkspace";
import { blogCategoryModelConfig } from "@/config/blog-models";
export default function CategoryListPage() { return <ModelWorkspace config={blogCategoryModelConfig} />; }
