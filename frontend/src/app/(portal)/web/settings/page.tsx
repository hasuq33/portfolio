'use client';

import SettingsView  from "@/components/core/views/settingsView/settingsView";
import { Configs } from "@/components/types/config";
import { apiFetch } from "@/lib/orm_service";
import SettingsSaveBar from "@/components/core/views/settingsView/SettingsSaveBar";

import { useEffect, useState } from "react";

const page = () => {

  const [configData, setConfigData] = useState<any>(null);
  const [saving , setIsonSave ] = useState<boolean>(false);
  const [hasChanges , sethasChanges ] = useState<boolean>(false);

  let configs:Configs = {
    model: 'ir.configuration',
    sections: [
      {
        title: 'General Information',
        description:
          'Manage company and application information.',
        fields: [
          {
            name: 'companyName',
            label: 'Company Name',
            widget: 'text',
          },
          {
            name: 'companyWebsite',
            label: 'Company Website',
            widget: 'url',
          },
          {
            name: 'mainEmail',
            label: 'Main Email',
            widget: 'email',
          },
        ],
      },
      {
        title: 'AI Integrations',

        fields: [
          {
            name: 'openAiApiKey',
            label: 'OpenAI API Key',
            widget: 'password',
          },

          {
            name: 'geminiApiKey',
            label: 'Gemini API Key',
            widget: 'password',
          },
        ],
      },
    ],
  };

  useEffect(() => {

    const fetchConfig = async () => {

      try {

        const fields =
          configs.sections.flatMap( (section) =>
              section.fields.map(
                (field) => field.name
              )
          );

        const data = await apiFetch({
          url: '/api/ir.configuration',
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          payload: JSON.stringify({
            model: configs.model,
            fields,
          }),
        });

        setConfigData(data);

      } catch (error) {
        console.error(error);
      }
    };

    fetchConfig();

  }, []);

  const saveConfiguration = () =>{};
  const discardChanges = () =>{};

  return (
    <div className="">
      <SettingsSaveBar
          visible={hasChanges}
          saving={saving}
          onSave={saveConfiguration}
          onDiscard={discardChanges}
      />
      <SettingsView configs={configs} data={configData} />
    </div>
  );
};

export default page;