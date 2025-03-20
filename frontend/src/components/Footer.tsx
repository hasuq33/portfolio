import React from 'react';
import { BiLogoGmail , BiLogoLinkedin} from "react-icons/bi";
import { FaInstagram } from "react-icons/fa6";
import { BsTwitterX } from "react-icons/bs";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className='bottom-0 border-t-2  left-0 right-0 w-full p-3'>
        <div className="flex flex-row justify-around items-center">
          <span>©️Harshiv Joshi</span>
          <span><a href='mailto:harshivjoshi1234@gmail.com' className='hover:underline'>harshivjoshi1234@gmail.com</a></span>
          <div className='flex flex-row gap-2 text-2xl items-center'>
            <Link href="mailto:harshivjoshi1234@gmail.com"><BiLogoGmail/></Link>
            <Link href="https://www.instagram.com/jharshiv/" target='_blank'><FaInstagram /></Link>
            <Link href="https://www.linkedin.com/in/harshiv-joshi-518357234/" target='_blank'><BiLogoLinkedin /></Link>
            <Link href="https://x.com/HarshivJoshi1?s=08" target='_blank'><BsTwitterX /></Link>
          </div>
      </div>
    </footer>
  )
}

export default Footer;