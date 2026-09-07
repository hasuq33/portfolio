"use client";

import { FormNotebookPage, FormRecordNavigation, FormSectionConfig, FormView } from "@/components/core/views/shared/FormView";
import { getUserAvatarColor, getUserInitial } from "@/lib/user-avatar";
import { UserRecord } from "./userView";

interface UserFormViewProps {
  user: UserRecord;
  isNew: boolean;
  readonly?: boolean;
  dirty: boolean;
  saving: boolean;
  errors?: Record<string, string | undefined>;
  formError?: string;
  onChange: (fieldName: string, value: unknown) => void;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
  onClose: () => void;
  recordNavigation?: FormRecordNavigation;
}

const getMainSections = (user: UserRecord, isNew: boolean): FormSectionConfig[] => [
  {
    id: "identity",
    title: "User identity",
    description: "Basic profile and workspace information.",
    fields: [
      {
        name: "avatar_image",
        label: "Profile image",
        widget: "image",
        colSpan: 2,
        imageAccept: "image/jpeg,image/png,image/webp,image/gif",
        imageMaxSizeMb: 2,
        imageFallback: getUserInitial(user.name, user.login),
        imageColorClassName: getUserAvatarColor(user.name, user.login),
        helpText: "The original image is stored securely with this user record.",
      },
      { name: "name", label: "Full Name", widget: "text", placeholder: "User's full name", autoFocus: isNew },
      { name: "login", label: "Login", widget: "text", required: true, placeholder: "Unique login" },
      { name: "email", label: "Email", widget: "email", required: true, placeholder: "name@example.com" },
      { name: "phone", label: "Phone", widget: "tel", placeholder: "+91 98765 43210" },
      { name: "website", label: "Website", widget: "url", placeholder: "https://example.com" },
    ],
  },
  {
    id: "company-access",
    title: "Company access",
    description: "Assign this user to one or more Company records.",
    fields: [
      {
        name: "allowedToAllCompanies",
        label: "Allow Access to All Companies",
        widget: "switch",
        colSpan: 2,
        helpText: "Allows this user to access all companies instead of only the companies selected below.",
      },
      {
        name: "companyIds",
        label: "Allowed Companies",
        widget: "many2many",
        colSpan: 2,
        disabled: user.allowedToAllCompanies,
        helpText: user.allowedToAllCompanies
          ? "Company selection is preserved while access to all companies is enabled."
          : "Select the Company records assigned to this user.",
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
      {
        name: "groupIds",
        label: "Groups",
        widget: "many2many",
        colSpan: 2,
        helpText: "Permissions from selected Groups are combined additively.",
        relation: {
          model: "Group",
          labelField: "name",
          recordLabel: "Group",
          recordLabelPlural: "Groups",
          searchFields: ["name", "description"],
          domain: [["active", "=", true]],
          order: "name asc",
          limit: 100,
        },
      },
    ],
  },
];

const getNotebookPages = (isNew: boolean): FormNotebookPage[] => [
  {
    id: "access",
    label: "Access & Security",
    description: "Control whether this user can access the workspace.",
    sections: [
      {
        id: "access-settings",
        fields: [
          {
            name: "status",
            label: "Status",
            widget: "select",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
          { name: "isVerified", label: "Verified user", widget: "switch", helpText: "Marks the account as verified for workspace access." },
          {
            name: "password",
            label: isNew ? "Password" : "New password",
            widget: "password",
            required: isNew,
            placeholder: isNew ? "Create a secure password" : "Leave empty to keep the current password",
            helpText: isNew ? "Required when creating a user." : "Only enter a value when changing the password.",
            colSpan: 2,
          },
        ],
      },
    ],
  },
  {
    id: "contact",
    label: "Address",
    sections: [
      {
        id: "address-fields",
        fields: [
          { name: "address", label: "Street", widget: "text", colSpan: 2, placeholder: "Street address" },
          { name: "address2", label: "Street 2", widget: "text", colSpan: 2, placeholder: "Apartment, suite, building, floor" },
          { name: "city", label: "City", widget: "text" },
          { name: "state", label: "State / Province", widget: "text" },
          { name: "zip", label: "ZIP / Postal code", widget: "text" },
          { name: "country", label: "Country", widget: "text" },
        ],
      },
    ],
  },
  {
    id: "profile",
    label: "Profile Details",
    sections: [
      {
        id: "profile-fields",
        fields: [
          { name: "jobTitle", label: "Job Title", widget: "text", placeholder: "e.g. Operations Manager" },
          { name: "department", label: "Department", widget: "text", placeholder: "e.g. Operations" },
          {
            name: "language",
            label: "Language",
            widget: "select",
            options: [
              { label: "English", value: "en" },
              { label: "Hindi", value: "hi" },
              { label: "French", value: "fr" },
              { label: "German", value: "de" },
              { label: "Spanish", value: "es" },
            ],
          },
          {
            name: "timezone",
            label: "Timezone",
            widget: "select",
            options: [
              { label: "Asia/Kolkata (IST)", value: "Asia/Kolkata" },
              { label: "UTC", value: "UTC" },
              { label: "Europe/London", value: "Europe/London" },
              { label: "America/New_York", value: "America/New_York" },
              { label: "America/Los_Angeles", value: "America/Los_Angeles" },
            ],
          },
          { name: "tags", label: "Tags", widget: "tags", colSpan: 2, helpText: "Separate multiple tags with commas." },
          { name: "joinedAt", label: "Joined date", widget: "date" },
        ],
      },
    ],
  },
];

export function UserFormView({
  user,
  isNew,
  readonly = false,
  dirty,
  saving,
  errors,
  formError,
  onChange,
  onSave,
  onDiscard,
  onClose,
  recordNavigation,
}: UserFormViewProps) {
  const title = isNew ? "New User" : (user.name?.trim() || user.login);

  return (
    <FormView
      data={user}
      title={title}
      description={isNew ? "Create a workspace user" : `@${user.login}`}
      sections={getMainSections(user, isNew)}
      notebooks={getNotebookPages(isNew)}
      readonly={readonly}
      dirty={dirty}
      saving={saving}
      errors={errors}
      formError={formError}
      allowDensityToggle
      onChange={onChange}
      onSave={onSave}
      onDiscard={onDiscard}
      onClose={onClose}
      breadcrumbs={[
        { label: "Settings", href: "/web/settings" },
        { label: "Users", href: "/web/settings/users" },
        { label: title },
      ]}
      recordNavigation={recordNavigation}
    />
  );
}
