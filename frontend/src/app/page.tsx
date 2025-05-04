import Image from "next/image";
import { BiLogoGmail } from "react-icons/bi";
import { FaLinkedin , FaGithub } from "react-icons/fa6";
import { Skill } from "@/components/Skills";

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
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white text-center">
          Skills & Languages
        </h2>
        <div className="">
          <Skill/>
        </div>
      </section>
    </div>
  );
}
