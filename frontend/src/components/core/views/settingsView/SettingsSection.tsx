'use client';

import { ReactNode } from "react";

interface SettingsSectionProps  {
    title:string;
    description?:string;
    children: ReactNode;
}

const SettingsSection = ({title,description,children}:SettingsSectionProps) =>{
    return(
        <div className="border rounded-xl p-6 mb-6 bg-card">
            <div className="mb-5">\
                <h2 className="font-semibold text-lg">{title}</h2>
                {description && (
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    )}
            </div>
            {children}
        </div>
    )
}

export default SettingsSection;