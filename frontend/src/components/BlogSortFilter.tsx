"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BiChevronDown } from "react-icons/bi";

export function BlogSortFilter() {
  const [position, setPosition] = React.useState("bottom")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Sort <BiChevronDown className="
              transition-transform duration-200
              data-[state=open]:rotate-180
            "/></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="dark:bg-gray-900 w-56">
        <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
          <DropdownMenuRadioItem value="top">Newest&rarr;Oldest</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="bottom">Oldest&rarr;Newest</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
