"use client";

import { useMemo } from "react";
import { Configs } from "@/components/types/config";
import WidgetRenderer from "../../widgets/WidgetRenderer";
import SettingsHeader from "./SettingsHeader";
import SettingsSection from "./SettingsSection";

interface SettingViewProps {
  configs: Configs;
  data: Record<string, unknown>;
  onChange: (fieldName: string, value: unknown) => void;
  disabled?: boolean;
  searchQuery?: string;
  searchField?: string | null;
}

const SettingsView = ({
  configs,
  data,
  onChange,
  disabled = false,
  searchQuery = "",
  searchField = null,
}: SettingViewProps) => {
  const visibleSections = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return configs.sections;

    return configs.sections.flatMap((section) => {
      const sectionText = `${section.title} ${section.description ?? ""}`.toLocaleLowerCase();
      const sectionMatches = sectionText.includes(query);
      const candidateFields = searchField
        ? section.fields.filter((field) => field.name === searchField)
        : section.fields;

      const fields = sectionMatches
        ? candidateFields
        : candidateFields.filter((field) => {
            const optionText = field.options?.map((option) => option.label).join(" ") ?? "";
            return `${field.label} ${field.name} ${field.placeholder ?? ""} ${optionText}`
              .toLocaleLowerCase()
              .includes(query);
          });

      return fields.length ? [{ ...section, fields }] : [];
    });
  }, [configs.sections, searchField, searchQuery]);

  return (
    <div className="mx-auto max-w-6xl md:p-6">
      <SettingsHeader title="Settings" description="Configure your application preferences" />
      {visibleSections.length ? (
        <div className="space-y-6">
          {visibleSections.map((section) => (
            <SettingsSection title={section.title} description={section.description} key={section.title}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {section.fields.map((field) => (
                  <WidgetRenderer
                    key={field.name}
                    widget={field.widget}
                    field={field}
                    value={data[field.name] ?? ""}
                    readonly={disabled}
                    onChange={(value) => onChange(field.name, value)}
                  />
                ))}
              </div>
            </SettingsSection>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-card px-6 py-12 text-center">
          <p className="font-medium">No settings found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try another field or search term.</p>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
