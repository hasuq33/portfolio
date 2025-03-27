"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggler } from "@/components/ThemeToggler";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 130);
    }
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])
  return (
    <header className={`w-[100%] z-50 fixed transition-all duration-[1s] ${scrolled ? "fixed top-0 left-0 right-0 shadow-lg bg-white/60 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700" : "dark:bg-gray-900/80"
      }`} >
      <nav className="header-light ">
        <div>
          <Link className="text-3xl font-bold tracking-wide transition-transform duration-300 hover:scale-110" href="/">{`<HARSHIV/>`}</Link>
        </div>
        <div className="flex flex-row gap-x-10 items-center">
          <ul className="flex flex-row list-none gap-x-[2rem]">
            <li className="relative group">
              <Link href="/aboutus" className="theme_link_style">
                About Us
              </Link>
              <span className="header_absolute_span"/>
            </li>
            <li className="relative group">
              <Link href="/contactus" className="theme_link_style">Contact US</Link>
              <span className="header_absolute_span"/>
            </li>
            <li className="relative group">
              <Link href="/blogs" className="theme_link_style">Blogs</Link>
              <span className="header_absolute_span"/>
            </li>
            <li className="relative group">
              <Link href="/projects" className="theme_link_style">Projects</Link>
              <span className="header_absolute_span"/>
            </li>
          </ul>
          <Link className="header-light-login" href="/web/login">Login</Link>
          <ThemeToggler />
        </div>
      </nav>
    </header>
  )
}

export default Header;