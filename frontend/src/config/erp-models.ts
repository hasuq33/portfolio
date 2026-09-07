import type { ModelViewConfig } from "@/components/core/views/shared/model-view-config";
import { MENU_ACCESS_OPTIONS, MODEL_ACCESS_OPTIONS } from "@/config/navigation";

export const companyModelConfig: ModelViewConfig = {
  model: "Company",
  accessKey: "companies",
  route: "/web/settings/companies",
  title: "Companies",
  singularTitle: "Company",
  description: "Manage legal entities and workspace company details.",
  labelField: "name",
  subtitleField: "code",
  archiveField: "active",
  search: {
    placeholder: "Search companies...",
    searchableFields: [
      { name: "name", label: "Company" },
      { name: "code", label: "Code" },
      { name: "email", label: "Email" },
      { name: "phone", label: "Phone" },
      { name: "city", label: "City" },
      { name: "country", label: "Country" },
    ],
    filterOptions: [
      { id: "active", label: "Active companies", field: "active", operator: "=", value: true },
      { id: "archived", label: "Archived companies", field: "active", operator: "=", value: false },
    ],
    defaultView: "list",
  },
  list: {
    order: "name asc, code asc",
    pageSize: 24,
    fields: [
      { name: "name", label: "Company", primary: true, className: "min-w-48" },
      { name: "code", label: "Code", className: "min-w-24" },
      { name: "email", label: "Email", className: "min-w-48" },
      { name: "phone", label: "Phone", className: "min-w-36" },
      { name: "city", label: "City", className: "min-w-32" },
      { name: "country", label: "Country", className: "min-w-32" },
      { name: "active", label: "Status", kind: "status", className: "min-w-28" },
    ],
  },
  form: {
    defaults: {
      name: "",
      code: "",
      email: "",
      phone: "",
      website: "",
      street: "",
      street2: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      active: true,
    },
    sections: [
      {
        id: "general",
        title: "General information",
        description: "Company identity and primary contact information.",
        fields: [
          { name: "name", label: "Company Name", widget: "text", required: true, autoFocus: true, placeholder: "My Company" },
          { name: "code", label: "Code", widget: "text", required: true, placeholder: "MAIN", helpText: "A unique uppercase technical code, such as MAIN, INDIA, or US." },
          { name: "email", label: "Email", widget: "email", placeholder: "company@example.com" },
          { name: "phone", label: "Phone", widget: "tel", placeholder: "+91 98765 43210" },
          { name: "website", label: "Website", widget: "url", colSpan: 2, placeholder: "https://example.com" },
        ],
      },
    ],
    notebooks: [
      {
        id: "address",
        label: "Address",
        description: "Registered or primary business address.",
        sections: [
          {
            id: "address-fields",
            fields: [
              { name: "street", label: "Street", widget: "text", colSpan: 2, placeholder: "Street address" },
              { name: "street2", label: "Street 2", widget: "text", colSpan: 2, placeholder: "Suite, building, floor" },
              { name: "city", label: "City", widget: "text" },
              { name: "state", label: "State / Province", widget: "text" },
              { name: "zip", label: "ZIP / Postal Code", widget: "text" },
              { name: "country", label: "Country", widget: "text" },
            ],
          },
        ],
      },
      {
        id: "status",
        label: "Status",
        description: "Archive a company instead of deleting its historical record.",
        sections: [
          {
            id: "status-fields",
            fields: [
              { name: "active", label: "Active", widget: "switch", helpText: "Archived companies remain available for historical records." },
            ],
          },
        ],
      },
    ],
  },
};

export const groupModelConfig: ModelViewConfig = {
  model: "Group",
  accessKey: "groups",
  route: "/web/settings/groups",
  title: "Groups",
  singularTitle: "Group",
  description: "Manage company applicability, menus, and model permissions.",
  labelField: "name",
  archiveField: "active",
  search: {
    placeholder: "Search groups...",
    searchableFields: [
      { name: "name", label: "Group" },
      { name: "description", label: "Description" },
    ],
    filterOptions: [
      { id: "active", label: "Active groups", field: "active", operator: "=", value: true },
      { id: "archived", label: "Archived groups", field: "active", operator: "=", value: false },
    ],
    defaultView: "list",
  },
  list: {
    order: "name asc",
    pageSize: 24,
    fields: [
      { name: "name", label: "Group Name", primary: true, className: "min-w-48" },
      { name: "companyIds", label: "Companies", kind: "count", className: "min-w-28" },
      { name: "menuItemIds", label: "Menus", kind: "count", className: "min-w-24" },
      { name: "active", label: "Status", kind: "status", className: "min-w-28" },
    ],
  },
  form: {
    defaults: {
      name: "",
      description: "",
      active: true,
      companyIds: [],
      menuItemIds: [],
      modelAccess: [],
    },
    sections: [
      {
        id: "general",
        title: "General",
        description: "Name and lifecycle of this access Group.",
        fields: [
          { name: "name", label: "Group Name", widget: "text", required: true, autoFocus: true, placeholder: "Sales Manager" },
          { name: "active", label: "Active", widget: "switch", helpText: "Archived Groups do not grant access." },
          { name: "description", label: "Description", widget: "textarea", colSpan: 2, placeholder: "Describe who should use this Group." },
        ],
      },
    ],
    notebooks: [
      {
        id: "companies",
        label: "Companies",
        description: "Choose the Companies where this Group is applicable.",
        sections: [
          {
            id: "company-access",
            fields: [
              {
                name: "companyIds",
                label: "Applicable Companies",
                widget: "many2many",
                required: true,
                colSpan: 2,
                relation: {
                  model: "Company",
                  labelField: "name",
                  recordLabel: "Company",
                  recordLabelPlural: "Companies",
                  secondaryField: "code",
                  searchFields: ["name", "code"],
                  domain: [["active", "=", true]],
                  order: "name asc, code asc",
                  limit: 100,
                },
              },
            ],
          },
        ],
      },
      {
        id: "menus",
        label: "Menu Access",
        description: "Select existing /web navigation entries visible to this Group.",
        sections: [
          {
            id: "menu-access",
            fields: [
              {
                name: "menuItemIds",
                label: "Menus",
                widget: "multi-select",
                colSpan: 2,
                options: [...MENU_ACCESS_OPTIONS],
              },
            ],
          },
        ],
      },
      {
        id: "model-access",
        label: "Model Access Rights",
        description: "Permissions from multiple Groups are combined additively.",
        sections: [
          {
            id: "model-access-matrix",
            fields: [
              {
                name: "modelAccess",
                label: "CRUD permissions",
                widget: "access-rights",
                colSpan: 2,
                accessModels: [...MODEL_ACCESS_OPTIONS],
              },
            ],
          },
        ],
      },
    ],
  },
};
