'use client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { ThemeToggler } from "@/components/ThemeToggler";

export const MobileHeadar = () => {
  return (<div className="lg:hidden">
    <Sheet>
      <SheetTrigger className="rotate-90"><span>|||</span></SheetTrigger>
      <SheetContent className="dark:bg-gray-900">
        <SheetHeader className="p-2">
          <SheetTitle className="dark:border-b-white border-b-2 p-2 border-b-black">Harshiv Joshi</SheetTitle>
          <SheetDescription className="flex flex-col justify-between h-100">
              <span className=" flex-col list-none gap-y-[1rem] flex">
                <li className="relative group">
                  <Link href="/" className="theme_link_style">
                    Home
                  </Link>
                  <span className="header_absolute_span" />
                </li>
                <li className="relative group">
                  <Link href="/aboutus" className="theme_link_style">
                    About Us
                  </Link>
                  <span className="header_absolute_span" />
                </li>
                <li className="relative group">
                  <Link href="/contactus" className="theme_link_style">Contact</Link>
                  <span className="header_absolute_span" />
                </li>
                <li className="relative group">
                  <Link href="/blogs" className="theme_link_style">Blogs</Link>
                  <span className="header_absolute_span" />
                </li>
                <li className="relative group">
                  <Link href="/projects" className="theme_link_style">Fun with 3D</Link>
                  <span className="header_absolute_span" />
                </li>
              </span>
            <span className="dark:border-t-white w-100 gap-x-3 p-2 border-t-black border-t-2 flex flex-row">
              <ThemeToggler propsClass={``}/>
              <Link className="header-light-login items-center flex" href="/web/login">Login</Link>
            </span>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  </div>)
}