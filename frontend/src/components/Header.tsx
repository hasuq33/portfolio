"use client";
import Link from "next/link";
import { useEffect , useState } from "react";

const Header = () => {
  const [scrolled , setScrolled] = useState(false);
  useEffect(()=>{
    const handleScroll = () =>{
      if(window.scrollY > 170){
        setScrolled(true);
      }else{
        setScrolled(false);
      }
    }
    window.addEventListener("scroll",handleScroll);

    return () =>{
      window.removeEventListener("scroll",handleScroll)
    }
  },[])
  return (
    <header className={`transition-all duration-[2s] ${
      scrolled ? "fixed top-0 left-0 right-0 bg-white shadow-md" : ""
    }`} >
      <nav className="header-light ">
        <div>
          <Link href="/">Harshiv</Link>
        </div>
        <div className="flex flex-row gap-x-10 items-center">
        <ul className="flex flex-row list-none gap-x-[2rem]">
            <li className=""><Link href="/aboutus">About US</Link></li>
            <li className=""><Link href="/contactus">Contact US</Link></li>
            <li className=""><Link href="/blogs">Blogs</Link></li>
            <li className=""><Link href="/projects">Projects</Link></li>
        </ul>
        <Link className="text-white bg-black rounded px-2 py-1 border transition-all duration-[1s] border-black hover:bg-white hover:text-black" href="/web/login">Login</Link>
        </div>
      </nav>
    </header>
  )
}

export default Header;