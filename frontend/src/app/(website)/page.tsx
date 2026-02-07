import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Harshiv Joshi | Odoo Developer, MERN & Next.js Expert",
  description:
    "Harshiv Joshi is a Full Stack Developer specializing in Odoo ERP, OWL framework, and modern web technologies like React and Next.js. Currently working at BrowseInfo, building scalable ERP and web solutions. Passionate about AI, open-source, and creating impactful software.",
  keywords: [
    "Harshiv Joshi",
    "Odoo Developer",
    "Odoo Expert",
    "OWL JS",
    "OWL Framework Expert",
    "React Developer",
    "Next.js Developer",
    "Full Stack Developer",
    "MERN Stack",
    "PostgreSQL",
    "ERP Developer",
    "Odoo ORM",
    "Odoo Custom Module",
    "Web Developer",
    "Frontend Developer",
    "Backend Developer",
    "Odoo Website Developer",
    "AI Enthusiast",
    "Open Source Contributor",
    "Software Engineer",
    "Odoo 17",
    "Odoo ERP Specialist"
  ],
};


import Image from "next/image";
import { BiLogoGmail } from "react-icons/bi";
import { FaLinkedin , FaGithub } from "react-icons/fa6";
import { Skill } from "@/components/Skills";
import Experience from "@/components/Experience";
import FamousQuote from "@/components/FamousQuote";

export default function Home() {
  return (
    <div className="px-6 md:px-20 h-[100%]  bg-white dark:bg-gray-900 transition-all overflow-hidden">
      <div className="relative  mx-auto max-w-7xl">
        <div className="absolute -top-20 -right-40 h-60 w-[36rem] transform-gpu bg-gradient-to-r from-yellow-200 via-pink-400 to-purple-600 rotate-[-10deg] rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="grid  grid-cols-1 md:grid-cols-2 mt-[67px] gap-8 items-center ">
        {/* Left Column: Introduction */}
        <div className="space-y-4 md:order-1 order-2">
          <h1 className="lg:text-4xl text-3xl font-bold text-gray-900 dark:text-white">
            Hi, I am Harshiv Joshi. 🙋‍♂️
          </h1>
          <p className="text-gray-700 dark:text-gray-300 text-lg">
            I am a **Full Stack Developer** specializing in **Odoo and MERN Stack**.
            I build scalable web applications and ERP solutions.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Passionate about **AI, Web Development, and Open Source**.
          </p>
          <div className="flex flex-row gap-x-3">
            <a href="https://github.com/hasuq33" target="_blank" aria-label="Harshiv Github"><FaGithub className="dark:text-white text-3xl" /></a>
            <a  target="_blank" href="https://www.linkedin.com/in/harshiv-joshi-518357234/" aria-label="Linkdin Harshiv"><FaLinkedin className="dark:text-white text-blue-900 text-3xl" /></a>
            <a  target="_blank" href="mailto:harshivjoshi1234@gmail.com" aria-label="Email Harshiv"><BiLogoGmail className="dark:text-white text-3xl text-red-800 " /></a>
          </div>
        </div>

        <div className="flex lg:justify-end justify-center md:order-2 order-1">
          <Image
            priority
            src="/assets/harshiv.webp"
            alt="Harshiv"
            width={350}
            height={350}
            className="rounded-[16px] object-cover    border-4 border-gray-300 dark:border-gray-700 shadow-lg"
          />
        </div>
      </div>
      <section className="mt-4">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-white text-center">
          Skills & Languages
        </h2>
        <div className="">
          <Skill/>
        </div>
      </section>
      <section className="mt-4">
        <div className="">
          <Experience/>
        </div>
      </section>
      <section className="my-4">
          <div className="px-4 sm:px-6 lg:px-8">
            <FamousQuote />
          </div>
      </section>
    </div>
  );
}
