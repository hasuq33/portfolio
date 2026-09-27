import type { ConfigField } from "@/components/types/config";
import type {
  ModelViewConfig,
  ModelRecordAction,
} from "@/components/core/views/shared/model-view-config";

const company: ConfigField = {
  name: "companyId",
  label: "Workspace company",
  widget: "select",
  required: true,
  readonlyAfterCreate: true,
  helpText: "The owning company is fixed after creation.",
  relation: {
    model: "Company",
    apiBase: "/crm/lookups/companies",
    labelField: "name",
  },
};
const salesperson: ConfigField = {
  name: "userId",
  label: "Salesperson",
  widget: "select",
  emptyLabel: "Unassigned",
  relation: {
    model: "User",
    apiBase: "/crm/lookups/users",
    labelField: "name",
  },
};
const priority: ConfigField = {
  name: "priority",
  label: "Priority",
  widget: "select",
  options: [
    { label: "Low", value: "low" },
    { label: "Medium", value: "medium" },
    { label: "High", value: "high" },
  ],
};
const tags: ConfigField = {
  name: "tagIds",
  label: "Tags",
  widget: "many2many",
  relation: {
    model: "CrmTag",
    labelField: "name",
    recordLabel: "Tag",
    recordLabelPlural: "Tags",
    companyField: "companyId",
    manageHref: "/web/crm/tags",
  },
};
const contacts: ConfigField[] = [
  { name: "contactName", label: "Contact name", widget: "text" },
  { name: "companyName", label: "Customer company", widget: "text" },
  { name: "email", label: "Email", widget: "email" },
  { name: "phone", label: "Phone", widget: "tel" },
  { name: "mobile", label: "Mobile", widget: "tel" },
  { name: "jobPosition", label: "Job position", widget: "text" },
  { name: "website", label: "Website", widget: "url", colSpan: 2 },
];
const addresses: ConfigField[] = [
  { name: "street", label: "Street", widget: "text", colSpan: 2 },
  { name: "street2", label: "Street 2", widget: "text", colSpan: 2 },
  ...["city", "state", "zip", "country"].map((name) => ({
    name,
    label:
      name === "zip"
        ? "ZIP / Postal code"
        : name[0].toUpperCase() + name.slice(1),
    widget: "text" as const,
  })),
];
const source: ConfigField = {
  name: "source",
  label: "Source",
  widget: "text",
  placeholder: "Website, referral, event...",
};
const actions: ModelRecordAction[] = [
  {
    id: "convert",
    label: "Convert to Opportunity",
    confirmation:
      "Convert this lead while keeping its record ID, contact details, owner, tags and notes?",
    endpoint: "/crm/leads/{id}/convert",
    when: { type: "lead" },
  },
  {
    id: "won",
    label: "Mark Won",
    confirmation: "Mark this opportunity as won?",
    endpoint: "/crm/opportunities/{id}/status",
    payload: { status: "won" },
    when: { type: "opportunity", status: "open" },
  },
  {
    id: "lost",
    label: "Mark Lost",
    confirmation: "Keep this opportunity in your history and mark it as lost.",
    endpoint: "/crm/opportunities/{id}/status",
    payload: { status: "lost" },
    reasonField: { name: "lostReason", label: "Lost reason" },
    when: { type: "opportunity", status: "open" },
  },
  {
    id: "reopen",
    label: "Reopen",
    confirmation:
      "Reopen this opportunity? Its current closing date will be cleared.",
    endpoint: "/crm/opportunities/{id}/status",
    payload: { status: "open" },
    when: { type: "opportunity", status: ["won", "lost"] },
  },
  {
    id: "delete",
    label: "Delete",
    confirmation:
      "Permanently delete this CRM record? This cannot be undone. Prefer marking an opportunity lost when keeping its history matters.",
    endpoint: "/api/CrmLead/{id}",
    method: "DELETE",
    permission: "delete",
    destructive: true,
  },
];
const statusChoices = {
  open: { label: "Open", tone: "neutral" as const },
  won: { label: "Won", tone: "success" as const },
  lost: { label: "Lost", tone: "danger" as const },
};
const defaults = {
  name: "",
  contactName: "",
  email: "",
  phone: "",
  mobile: "",
  companyName: "",
  jobPosition: "",
  website: "",
  street: "",
  street2: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  companyId: null,
  userId: null,
  stageId: null,
  expectedRevenue: 0,
  probability: 0,
  priority: "medium",
  tagIds: [],
  source: "",
  description: "",
  dateDeadline: null,
  status: "open",
};

function leadConfig(opportunity: boolean): ModelViewConfig {
  const type = opportunity ? "opportunity" : "lead";
  return {
    model: "CrmLead",
    accessKey: "leads",
    route: `/web/crm/${opportunity ? "opportunities" : "leads"}`,
    title: opportunity ? "Opportunities" : "Leads",
    singularTitle: opportunity ? "Opportunity" : "Lead",
    description: opportunity
      ? "Manage qualified deals, stages and outcomes."
      : "Capture requirements and qualify your next opportunity.",
    labelField: "name",
    subtitleField: opportunity ? "status" : "companyName",
    breadcrumbs: [{ label: "CRM", href: "/web/crm" }],
    baseDomain: [["type", "=", type]],
    createOnlyFields: ["type"],
    contextDefaults: { companyField: "companyId", userField: "userId" },
    recordPermissionsField: "_access",
    recordRoutes: {
      field: "type",
      routes: { lead: "/web/crm/leads", opportunity: "/web/crm/opportunities" },
    },
    actions,
    writableFields: Object.keys(defaults)
      .filter((field) => field !== "status")
      .concat("type"),
    search: {
      placeholder: `Search ${opportunity ? "opportunities" : "leads"}...`,
      defaultView: "list",
      searchableFields: [
        "name",
        "contactName",
        "companyName",
        "email",
        "phone",
      ].map((name) => ({
        name,
        label: {
          name: "Title",
          contactName: "Contact",
          companyName: "Customer company",
          email: "Email",
          phone: "Phone",
        }[name]!,
      })),
      filterOptions: opportunity
        ? ["open", "won", "lost"].map((status) => ({
            id: status,
            label: statusChoices[status as keyof typeof statusChoices].label,
            field: "status",
            operator: "=" as const,
            value: status,
          }))
        : [],
    },
    list: {
      order: "createdAt desc",
      pageSize: 24,
      sortOptions: [
        { label: "Newest first", value: "createdAt desc" },
        { label: "Oldest first", value: "createdAt asc" },
        { label: "Title A–Z", value: "name asc" },
        ...(opportunity
          ? [
              { label: "Highest revenue", value: "expectedRevenue desc" },
              { label: "Expected closing", value: "dateDeadline asc" },
            ]
          : []),
      ],
      fields: opportunity
        ? [
            {
              name: "name",
              label: "Opportunity",
              primary: true,
              className: "min-w-52",
            },
            { name: "companyName", label: "Customer", className: "min-w-36" },
            { name: "userId", label: "Salesperson", kind: "relation" },
            { name: "stageId", label: "Stage", kind: "relation" },
            { name: "expectedRevenue", label: "Expected revenue" },
            { name: "probability", label: "Probability (%)" },
            { name: "priority", label: "Priority" },
            { name: "dateDeadline", label: "Expected closing", kind: "date" },
            {
              name: "status",
              label: "Status",
              kind: "status",
              choices: statusChoices,
            },
          ]
        : [
            {
              name: "name",
              label: "Lead",
              primary: true,
              className: "min-w-52",
            },
            { name: "companyName", label: "Customer company" },
            { name: "contactName", label: "Contact" },
            { name: "email", label: "Email" },
            { name: "phone", label: "Phone" },
            { name: "userId", label: "Salesperson", kind: "relation" },
            { name: "priority", label: "Priority" },
            { name: "source", label: "Source" },
            { name: "createdAt", label: "Created", kind: "date" },
          ],
    },
    form: {
      defaults: { ...defaults, type },
      sections: [
        {
          id: "identity",
          title: opportunity ? "Opportunity" : "Lead",
          description: "Requirements and workspace ownership.",
          fields: [
            {
              name: "name",
              label: opportunity ? "Opportunity title" : "Lead title",
              widget: "text",
              required: true,
              autoFocus: true,
              colSpan: 2,
            },
            company,
            ...(opportunity
              ? [
                  {
                    name: "status",
                    label: "Status",
                    widget: "select" as const,
                    readonly: true,
                    options: Object.entries(statusChoices).map(
                      ([value, choice]) => ({ value, label: choice.label }),
                    ),
                  },
                ]
              : [salesperson]),
          ],
        },
        ...(opportunity
          ? [
              {
                id: "pipeline",
                title: "Pipeline",
                description: "Stage and forecast for this opportunity.",
                fields: [
                  {
                    name: "stageId",
                    label: "Stage",
                    widget: "select" as const,
                    emptyLabel: "First active stage on save",
                    relation: {
                      model: "CrmStage",
                      labelField: "name",
                      companyField: "companyId",
                      domain: [
                        ["active", "=", true] as [string, string, unknown],
                      ],
                      order: "sequence asc",
                      manageHref: "/web/crm/stages",
                    },
                  },
                  {
                    name: "probability",
                    label: "Probability (%)",
                    widget: "number" as const,
                    min: 0,
                    max: 100,
                    step: 1,
                  },
                  {
                    name: "expectedRevenue",
                    label: "Expected revenue",
                    widget: "number" as const,
                    min: 0,
                    step: 0.01,
                  },
                  {
                    name: "dateDeadline",
                    label: "Expected closing",
                    widget: "date" as const,
                  },
                  priority,
                  salesperson,
                ],
              },
            ]
          : []),
        { id: "contact", title: "Contact information", fields: contacts },
        {
          id: "sales",
          title: "Sales information",
          fields: opportunity ? [tags, source] : [priority, source, tags],
        },
      ],
      notebooks: [
        {
          id: "notes",
          label: "Notes",
          sections: [
            {
              id: "description",
              fields: [
                {
                  name: "description",
                  label: "Requirements / Notes",
                  widget: "textarea",
                  colSpan: 2,
                },
              ],
            },
          ],
        },
        {
          id: "address",
          label: "Address",
          sections: [{ id: "address-fields", fields: addresses }],
        },
        {
          id: "history",
          label: "Record details",
          sections: [
            {
              id: "audit",
              fields: [
                {
                  name: "createdAt",
                  label: "Created at",
                  widget: "text",
                  readonly: true,
                },
                {
                  name: "convertedAt",
                  label: "Converted at",
                  widget: "text",
                  readonly: true,
                },
                {
                  name: "convertedBy",
                  label: "Converted by",
                  widget: "select",
                  readonly: true,
                  relation: {
                    model: "User",
                    apiBase: "/crm/lookups/users",
                    labelField: "name",
                  },
                },
                {
                  name: "dateClosed",
                  label: "Closed at",
                  widget: "text",
                  readonly: true,
                },
                {
                  name: "lostReason",
                  label: "Last lost reason",
                  widget: "textarea",
                  readonly: true,
                  colSpan: 2,
                },
              ],
            },
          ],
        },
      ],
    },
  };
}
export const crmLeadConfig = leadConfig(false);
export const crmOpportunityConfig = leadConfig(true);

function referenceConfig(stage: boolean): ModelViewConfig {
  const fields: ConfigField[] = [
    {
      name: "name",
      label: "Name",
      widget: "text",
      required: true,
      autoFocus: true,
    },
    company,
    ...(stage
      ? [
          {
            name: "sequence",
            label: "Sequence",
            widget: "number" as const,
            min: 0,
            step: 1,
          },
          {
            name: "probability",
            label: "Suggested probability (%)",
            widget: "number" as const,
            min: 0,
            max: 100,
          },
          { name: "active", label: "Active", widget: "switch" as const },
          {
            name: "fold",
            label: "Fold in future pipeline",
            widget: "switch" as const,
          },
        ]
      : [
          {
            name: "color",
            label: "Color",
            widget: "text" as const,
            placeholder: "#2563eb",
            helpText: "Optional six-digit hex color.",
          },
        ]),
  ];
  return {
    model: stage ? "CrmStage" : "CrmTag",
    accessKey: "leads",
    route: `/web/crm/${stage ? "stages" : "tags"}`,
    title: stage ? "CRM Stages" : "CRM Tags",
    singularTitle: stage ? "Stage" : "Tag",
    labelField: "name",
    description: "Company-specific CRM choices.",
    breadcrumbs: [{ label: "CRM", href: "/web/crm" }],
    archiveField: stage ? "active" : undefined,
    contextDefaults: { companyField: "companyId" },
    writableFields: fields.map((f) => f.name),
    recordPermissionsField: "_access",
    search: {
      placeholder: "Search names...",
      defaultView: "list",
      searchableFields: [{ name: "name", label: "Name" }],
    },
    list: {
      order: stage ? "sequence asc" : "name asc",
      fields: [
        { name: "name", label: "Name", primary: true },
        { name: "companyId", label: "Company", kind: "relation" },
        ...(stage
          ? [
              { name: "sequence", label: "Sequence" },
              { name: "active", label: "Active", kind: "status" as const },
            ]
          : [{ name: "color", label: "Color" }]),
      ],
    },
    form: {
      defaults: stage
        ? {
            name: "",
            companyId: null,
            sequence: 10,
            probability: 0,
            active: true,
            fold: false,
          }
        : { name: "", companyId: null, color: "" },
      sections: [{ id: "general", title: stage ? "Stage" : "Tag", fields }],
    },
  };
}
export const crmConfigs: Record<string, ModelViewConfig> = {
  leads: crmLeadConfig,
  opportunities: crmOpportunityConfig,
  stages: referenceConfig(true),
  tags: referenceConfig(false),
};
