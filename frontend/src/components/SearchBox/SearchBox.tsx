'use client';

import { SearchIcon } from 'lucide-react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

export function ViewSearchInputBox() {

  return (
    <div className="w-full max-w-sm">

      <InputGroup
        className="
          rounded-xl
          border
          border-gray-200
          dark:border-gray-700
          bg-white
          dark:bg-gray-900
          shadow-sm
          transition-all
          focus-within:ring-2
          focus-within:ring-blue-500/20
          focus-within:border-blue-500
        "
      >

        <InputGroupAddon
          align="inline-start"
          className="pl-3"
        >
          <SearchIcon
            size={18}
            className="text-muted-foreground"
          />
        </InputGroupAddon>

        <InputGroupInput
          id="view-search-input"
          placeholder="Search records..."
          type='search'
          className="
            border-0
            shadow-none
            focus-visible:ring-0
            bg-transparent
            text-sm
            h-11
          "
        />

      </InputGroup>

    </div>
  );
}