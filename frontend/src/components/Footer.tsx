import React from 'react';
import { BiLogoGmail, BiLogoLinkedin } from "react-icons/bi";
import { FaInstagram } from "react-icons/fa6";
import { BsTwitterX } from "react-icons/bs";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className=" border-t-2 w-full py-6 px-20 bg-gray-100 dark:bg-gray-900 dark:text-white transition-all animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
        {/* Copyright Text */}
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          ©️ 2025 Harshiv Joshi
        </span>

        {/* Email */}
        <span className="text-gray-600 dark:text-gray-300">
          <a href="mailto:harshivjoshi1234@gmail.com" className="hover:underline">
            harshivjoshi1234@gmail.com
          </a>
        </span>

        {/* Social Icons */}
        <div className="flex gap-4 text-2xl">
          <Link href="mailto:harshivjoshi1234@gmail.com" aria-label='Contact Me Through Gmial' className="hover:text-red-600 transform hover:scale-110 transition-all duration-300">
            <BiLogoGmail />
          </Link>
          <Link href="https://www.instagram.com/jharshiv/" aria-label='Contact Me on Instagram' target="_blank" className="hover:text-pink-500 transform hover:scale-110 transition-all duration-300">
            <FaInstagram />
          </Link>
          <Link href="https://www.linkedin.com/in/harshiv-joshi-518357234/" aria-label='Contact Me on Linkdind' target="_blank" className="hover:text-blue-600 transform hover:scale-110 transition-all duration-300">
            <BiLogoLinkedin />
          </Link>
          <Link href="https://x.com/HarshivJoshi1?s=08" target="_blank" aria-label='Contact Me on X' className="hover:text-gray-700 dark:hover:text-white transform hover:scale-110 transition-all duration-300">
            <BsTwitterX />
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
