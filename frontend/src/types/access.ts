export interface CrudAccess {
  read: boolean;
  create: boolean;
  write: boolean;
  delete: boolean;
}

export interface EffectiveAccess {
  menuItemIds: string[];
  modelAccess: Partial<Record<string, CrudAccess>>;
  currentCompanyId: string | null;
}

export const noCrudAccess: CrudAccess = {
  read: false,
  create: false,
  write: false,
  delete: false,
};

export const getCrudAccess = (
  access: EffectiveAccess | undefined,
  modelKey: string,
) => access?.modelAccess[modelKey] ?? noCrudAccess;
