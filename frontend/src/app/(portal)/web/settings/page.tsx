"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SettingsView from "@/components/core/views/settingsView/settingsView";
import SettingsSaveBar from "@/components/core/views/settingsView/SettingsSaveBar";
import { Configs } from "@/components/types/config";
import { apiFetch } from "@/lib/orm_service";
import { useViewSearch } from "@/context/ViewSearchContext";
import { ViewSearchConfig } from "@/components/web/search-status-bar.types";

const configs: Configs = {
  model: "ir.configuration",
  sections: [
    {
      title: "General Information",
      description: "Manage company and application information.",
      fields: [
        { name: "companyName", label: "Company Name", widget: "text", required: true },
        { name: "companyWebsite", label: "Company Website", widget: "url", placeholder: "https://example.com" },
        { name: "mainEmail", label: "Main Email", widget: "email", placeholder: "hello@example.com" },
      ],
    },
    {
      title: "AI Integrations",
      description: "Configure the AI providers used by your workspace.",
      fields: [
        { name: "openAiApiKey", label: "OpenAI API Key", widget: "password", placeholder: "Enter a new key" },
        { name: "geminiApiKey", label: "Gemini API Key", widget: "password", placeholder: "Enter a new key" },
        {
          name: "defaultAiProvider",
          label: "Default AI Provider",
          widget: "select",
          options: [{ label: "OpenAI", value: "openai" }, { label: "Gemini", value: "gemini" }],
        },
      ],
    },
    { title: "Interface", fields: [{ name: "compactMode", label: "Compact mode", widget: "switch" }] },
  ],
};

const emptyConfig: Record<string, unknown> = {
  companyName: "",
  companyWebsite: "",
  mainEmail: "",
  openAiApiKey: "",
  geminiApiKey: "",
  defaultAiProvider: "openai",
  compactMode: false,
};

const settingsSearchConfig: ViewSearchConfig = {
  placeholder: "Find a setting...",
  searchableFields: configs.sections.flatMap((section) =>
    section.fields.map((field) => ({ name: field.name, label: field.label })),
  ),
};

export default function SettingsPage() {
  const { state: searchState, configure, reset } = useViewSearch();
  const [configurationId, setConfigurationId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>(emptyConfig);
  const [originalData, setOriginalData] = useState<Record<string, unknown>>(emptyConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hasChanges = useMemo(() => JSON.stringify(formData) !== JSON.stringify(originalData), [formData, originalData]);

  useEffect(() => {
    configure(settingsSearchConfig);
    return reset;
  }, [configure, reset]);

  const fetchConfiguration = useCallback(async () => {
    setLoading(true);
    const fields = configs.sections.flatMap((section) => section.fields.map((field) => field.name));
    const response = await apiFetch({
      url: `/api/${configs.model}/search`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      payload: JSON.stringify({ fields: ["_id", ...fields], limit: 1 }),
    });

    if (response?.ok) {
      const records = await response.json();
      const record = records[0];
      if (record) {
        const normalized = { ...emptyConfig, ...record };
        setConfigurationId(record._id);
        setFormData(normalized);
        setOriginalData(normalized);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchConfiguration(); }, [fetchConfiguration]);

  const saveConfiguration = async () => {
    setSaving(true);
    const { _id, createdAt, updatedAt, __v, ...payload } = formData;
    const response = await apiFetch({
      url: configurationId ? `/api/${configs.model}/${configurationId}` : `/api/${configs.model}`,
      method: configurationId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      payload: JSON.stringify(payload),
    });

    if (response?.ok) {
      const saved = await response.json();
      const normalized = { ...emptyConfig, ...saved };
      setConfigurationId(saved._id);
      setFormData(normalized);
      setOriginalData(normalized);
    }
    setSaving(false);
  };

  return (
    <div>
      <SettingsSaveBar visible={hasChanges} saving={saving} onSave={saveConfiguration} onDiscard={() => setFormData(originalData)} />
      {loading ? (
        <div className="mx-auto max-w-6xl p-6 text-sm text-muted-foreground">Loading settings...</div>
      ) : (
        <SettingsView
          configs={configs}
          data={formData}
          searchQuery={searchState.query}
          searchField={searchState.searchField}
          onChange={(fieldName, value) => setFormData((current) => ({ ...current, [fieldName]: value }))}
          disabled={saving}
        />
      )}
    </div>
  );
}
