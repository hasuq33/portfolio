"use client";

import {
  CalendarDays,
  ChevronDown,
  Filter,
  Layers3,
  LayoutGrid,
  List,
  RotateCcw,
  X,
} from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import { useUser } from "@/context/UserContext";
import { useViewSearch } from "@/context/ViewSearchContext";
import { ThemeToggler } from "../ThemeToggler";
import { ViewSearchInputBox } from "../SearchBox/SearchBox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const viewIcons = {
  list: List,
  kanban: LayoutGrid,
  gantt: CalendarDays,
};

export const SearchStatusBar = () => {
  const { user, loading } = useUser();
  const {
    config,
    state,
    clear,
    setQuery,
    setSearchField,
    toggleFilter,
    setGroupBy,
    setView,
  } = useViewSearch();

  if (loading) return <div className="h-16 animate-pulse border-b bg-muted/40" />;
  if (!user) return null;

  const searchableFields = config.searchableFields ?? [];
  const filterOptions = config.filterOptions ?? [];
  const groupByOptions = config.groupByOptions ?? [];
  const viewOptions = config.viewOptions ?? [];
  const selectedField = searchableFields.find((field) => field.name === state.searchField);
  const selectedGroup = groupByOptions.find((option) => option.value === state.groupBy);
  const hasRefinements = Boolean(state.query || state.searchField || state.filters.length || state.groupBy);

  return (
    <header className="border-b bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-56 flex-1 sm:max-w-xl">
          <ViewSearchInputBox
            value={state.query}
            placeholder={config.placeholder}
            onChange={setQuery}
            onEscape={() => setQuery("")}
          />
        </div>

        {searchableFields.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="max-w-44 justify-between">
                <span className="truncate">{selectedField?.label ?? "All fields"}</span>
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Search within</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={state.searchField ?? "__all__"} onValueChange={(value) => setSearchField(value === "__all__" ? null : value)}>
                <DropdownMenuRadioItem value="__all__">All fields</DropdownMenuRadioItem>
                {searchableFields.map((field) => (
                  <DropdownMenuRadioItem key={field.name} value={field.name}>{field.label}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {filterOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="Filters">
                <Filter />
                <span className="hidden sm:inline">Filters</span>
                {state.filters.length > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{state.filters.length}</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent  align="start" className="w-60 dark:bg-gray-800 bg-white">
              <DropdownMenuLabel>Filter records</DropdownMenuLabel>
              {filterOptions.map((filter) => (
                <DropdownMenuCheckboxItem
                  key={filter.id}
                  checked={state.filters.some((selected) => selected.id === filter.id)}
                  onCheckedChange={() => toggleFilter(filter)}
                  onSelect={(event) => event.preventDefault()}
                >
                  {filter.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {groupByOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={state.groupBy ? "secondary" : "outline"}>
                <Layers3 />
                <span className="hidden sm:inline">{selectedGroup ? `Group: ${selectedGroup.label}` : "Group by"}</span>
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Group records by</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={state.groupBy ?? "__none__"} onValueChange={(value) => setGroupBy(value === "__none__" ? null : value)}>
                <DropdownMenuRadioItem value="__none__">No grouping</DropdownMenuRadioItem>
                {groupByOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>{option.label}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {viewOptions.length > 0 && (
          <div className="flex items-center rounded-md border bg-background p-0.5" role="group" aria-label="View type">
            {viewOptions.map((option) => {
              const Icon = viewIcons[option.value as keyof typeof viewIcons] ?? LayoutGrid;
              return (
                <Button
                  key={option.value}
                  variant={state.view === option.value ? "secondary" : "ghost"}
                  size="icon-sm"
                  title={option.label}
                  aria-label={option.label}
                  aria-pressed={state.view === option.value}
                  onClick={() => setView(option.value)}
                >
                  <Icon />
                </Button>
              );
            })}
          </div>
        )}

        {hasRefinements && (
          <Button variant="ghost" size="icon" title="Clear search and refinements" aria-label="Clear search and refinements" onClick={clear}>
            <RotateCcw />
          </Button>
        )}

        <div className="ml-auto hidden items-center gap-3 border-l pl-3 lg:flex">
          <span className="text-sm text-muted-foreground">
            Welcome, <span className="font-medium text-foreground">{user.name || user.login}</span>
          </span>
          <ProfileDropdown user={user} />
          <ThemeToggler propsClass="hidden lg:block" />
        </div>
      </div>

      {(state.filters.length > 0 || selectedGroup) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label="Active refinements">
          {state.filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => toggleFilter(filter)}
              className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-1 text-xs hover:bg-accent"
            >
              {filter.label}<X className="size-3" />
            </button>
          ))}
          {selectedGroup && (
            <button
              type="button"
              onClick={() => setGroupBy(null)}
              className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-1 text-xs hover:bg-accent"
            >
              Grouped by {selectedGroup.label}<X className="size-3" />
            </button>
          )}
        </div>
      )}
    </header>
  );
};
