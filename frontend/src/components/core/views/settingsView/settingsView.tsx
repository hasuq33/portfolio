'use client '

import { useState , useEffect } from 'react';
import { Configs } from "@/components/types/config";
import WidgetRenderer from "../../widgets/WidgetRenderer";

interface SettingViewProps {
  configs:Configs,
  data:Record<string, any>;
}

const SettingsView = ({configs , data }: SettingViewProps) => {
  const [formData , setFormData ] = useState<Record<string,any>>({});
  const [originalData, setOriginalData] = useState({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
      setFormData(data);
      setOriginalData(data);
  }, [data]);

  const updateField = (fieldName:string,value:any) =>{
     const updatedData = {
        ...formData,
        [fieldName]: value,
    };


    setFormData(updatedData);

    setHasChanges(
        JSON.stringify(updatedData) !==
        JSON.stringify(originalData)
    );
  }
  return (
    <div className="max-w-6xl mx-auto  md:p-6">
      <div className="mb-8">
         <h1 className="text-2xl font-bold">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Configure your application preferences
        </p>
      </div>
      <div className="space-y-6">
        {configs.sections.map((section)=>(
          <div className='rounded-xl border bg-card p-5 md:p-6' key={section.title}>
            {/* Section Header */}
            <h2 className='text-lg font-semibold'>{section.title}</h2>
            {section.description &&(
              <p className='text-sm text-muted-foreground mt-1'>
                {section.description}
              </p>
            )}
            {/* Fields  */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {section.fields.map((field) => (

                <WidgetRenderer
                  key={field.name}
                  widget={'text'}
                  field={field}
                  value={formData[field.name] ?? ''}
                  onChange={(value) =>
                    updateField(field.name, value)
                  }
                />

              ))}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsView;