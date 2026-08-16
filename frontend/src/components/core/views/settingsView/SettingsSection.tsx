"use client";

import { ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

const SettingsSection = ({ title, description, children }: SettingsSectionProps) => (
  <section className="px-5 py-6 sm:px-7 sm:py-7 lg:grid lg:grid-cols-[minmax(11rem,0.34fr)_minmax(0,1fr)] lg:gap-10">
    <div className="mb-5 lg:mb-0">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">{description}</p>}
    </div>
    <div className="min-w-0">{children}</div>
  </section>
);

export default SettingsSection;
