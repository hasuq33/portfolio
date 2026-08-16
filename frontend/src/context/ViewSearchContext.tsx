"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import {
  createViewSearchState,
  defaultViewSearchConfig,
  ViewFilter,
  ViewSearchConfig,
  ViewSearchState,
} from "@/components/web/search-status-bar.types";

interface ViewSearchContextValue {
  config: ViewSearchConfig;
  state: ViewSearchState;
  configure: (config: ViewSearchConfig) => void;
  reset: () => void;
  clear: () => void;
  setQuery: (query: string) => void;
  setSearchField: (field: string | null) => void;
  toggleFilter: (filter: ViewFilter) => void;
  setGroupBy: (field: string | null) => void;
  setView: (view: string) => void;
}

const ViewSearchContext = createContext<ViewSearchContextValue | null>(null);

export function ViewSearchProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ViewSearchConfig>(defaultViewSearchConfig);
  const [state, setState] = useState<ViewSearchState>(() => createViewSearchState());

  const configure = useCallback((nextConfig: ViewSearchConfig) => {
    const normalized = { ...defaultViewSearchConfig, ...nextConfig };
    setConfig(normalized);
    setState(createViewSearchState(normalized));
  }, []);

  const reset = useCallback(() => {
    setConfig(defaultViewSearchConfig);
    setState(createViewSearchState());
  }, []);

  const clear = useCallback(() => {
    setState(createViewSearchState(config));
  }, [config]);

  const setQuery = useCallback((query: string) => {
    setState((current) => ({ ...current, query }));
  }, []);

  const setSearchField = useCallback((searchField: string | null) => {
    setState((current) => ({ ...current, searchField }));
  }, []);

  const toggleFilter = useCallback((filter: ViewFilter) => {
    setState((current) => {
      const selected = current.filters.some((item) => item.id === filter.id);
      return {
        ...current,
        filters: selected
          ? current.filters.filter((item) => item.id !== filter.id)
          : [...current.filters, filter],
      };
    });
  }, []);

  const setGroupBy = useCallback((groupBy: string | null) => {
    setState((current) => ({ ...current, groupBy }));
  }, []);

  const setView = useCallback((view: string) => {
    setState((current) => ({ ...current, view }));
  }, []);

  const value = useMemo(() => ({
    config,
    state,
    configure,
    reset,
    clear,
    setQuery,
    setSearchField,
    toggleFilter,
    setGroupBy,
    setView,
  }), [config, state, configure, reset, clear, setQuery, setSearchField, toggleFilter, setGroupBy, setView]);

  return <ViewSearchContext.Provider value={value}>{children}</ViewSearchContext.Provider>;
}

export function useViewSearch() {
  const context = useContext(ViewSearchContext);
  if (!context) throw new Error("useViewSearch must be used inside ViewSearchProvider");
  return context;
}
