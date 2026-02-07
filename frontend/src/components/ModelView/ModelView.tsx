"use client";

import { useState } from "react";
import SideBar from "../web/SideBar";
import StatusBar from "../web/StatusBar";
import { ListView } from "../ListView/ListView";

type ViewType = "list" | "kanban" | "form";
type DomainTuple = [string, string, any];

interface FieldConfig {
  name: string;
  label?: string;
  type: string;
  editable?: boolean;
  widget?: string;
}

interface ModelViewProps {
  model: string;
  fields: FieldConfig[];
  domain?: DomainTuple[];
  order?: string;
}

const ModelView = ({
  model,
  fields,
  domain = [],
  order = "id desc",
}: ModelViewProps) => {
  const [view] = useState<ViewType>("list");

  return (
    <div className="flex h-screen">
      <SideBar menus={[]} />

      <div className="flex-1 flex flex-col">
        <StatusBar />

        <div className="flex-1 p-4">
          {view === "list" && (
            <ListView
              model={model}
              fields={fields}
              domain={domain}
              order={order}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelView;
