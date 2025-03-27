import Image from "next/image";

export default function Home() {
  return (
    <div className="px-6 md:px-20 bg-white dark:bg-gray-900 transition-all overflow-hidden">
      {/* Background Gradient Effect */}
      <div className="relative mx-auto max-w-7xl">
        <div className="absolute -top-20 -right-40 h-60 w-[36rem] transform-gpu bg-gradient-to-r from-yellow-200 via-pink-400 to-purple-600 rotate-[-10deg] rounded-full blur-3xl opacity-30"></div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-screen">
        {/* Left Column: Introduction */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Hi, I am Harshiv Joshi. 🙋‍♂️
          </h1>
          <p className="text-gray-700 dark:text-gray-300 text-lg">
            I am a **Full Stack Developer** specializing in **Odoo and MERN Stack**.
            I build scalable web applications and ERP solutions.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Passionate about **AI, Web Development, and Open Source**.
          </p>
        </div>

        {/* Right Column: Profile Image */}
        <div className="flex justify-center">
          <Image
            src="/assets/harshiv.jpeg"
            alt="Harshiv"
            width={350}
            height={350}
            className="rounded-full border-4 border-gray-300 dark:border-gray-700 shadow-lg"
          />
        </div>
      </div>

      {/* Additional Section: What I Do */}
      <section className="py-10">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white text-center">
          What I Do 💻
        </h2>
        <div className="flex flex-wrap justify-center gap-6 mt-6">
          <span className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-full text-gray-900 dark:text-white">
            Odoo Development
          </span>
          <span className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-full text-gray-900 dark:text-white">
            MERN Stack
          </span>
          <span className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-full text-gray-900 dark:text-white">
            AI & TensorFlow
          </span>
          <span className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-full text-gray-900 dark:text-white">
            ERP Solutions
          </span>
        </div>
      </section>
    </div>
  );
}
