import { ContactForm } from "@/components/ContactForm";

const Page = () => {
  return (
    <div className="form-format">
        <h1 className="text-center text-4xl font-bold mb-12 text-gray-800 dark:text-white">
          Contact <span className="text-blue-500">Me</span>
        </h1>

  <div className="
      max-w-3xl mx-auto p-10 rounded-3xl shadow-sm 
      bg-white/20 dark:bg-gray-800/20 
      backdrop-blur-2xl border border-white/40 dark:border-gray-700
    ">
    <ContactForm />
  </div>
</div>

  );
};

export default Page;
