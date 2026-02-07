"use client";

import { useEffect , useRef } from "react";
import { useForm } from "react-hook-form";
import gsap from "gsap";

type FormValues = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export const ContactForm = () => {
  const formRef = useRef<HTMLFormElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = (data: FormValues) => {
    console.log("Lead Submitted:", data);
  };

  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(
        formRef.current.children,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
        }
      );
    }
  }, []);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8"
    >
      {/* INPUT GROUP */}
      {[
        { id: "name", label: "Full Name", type: "text", required: true },
        {
          id: "email",
          label: "Email Address",
          type: "email",
          required: true,
        },
        { id: "phone", label: "Phone Number", type: "tel", required: false },
      ].map((field) => (
        <div key={field.id} className="relative w-full">
          <input
            {...register(field.id as keyof FormValues, {
              required: field.required
                ? `${field.label} is required`
                : false,
            })}
            type={field.type}
            placeholder=" "
            className="
              w-full px-4 py-4 bg-white/10 dark:bg-black/10 
              border border-white-300 dark:border-gray-700 backdrop-blur-xl
              rounded-xl text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500
              peer transition-all placeholder-transparent
            "
          />
          <label
            className="
              absolute left-1 scale-75 peer-placeholder-shown:scale-100 peer-focus:scale-75 -top-[0.8rem] px-2 origin-left peer-placeholder-shown:top-2 peer-focus:-top-[0.8rem] peer-focus:text-blue-500 text-body transition-all pointer-events-none 
              dark:bg-gray-800/20 bg-white
            "
          >
            {field.label}
          </label>
          {errors[field.id as keyof FormValues] && (
            <p className="text-red-500 text-xs mt-2">
              {String(errors[field.id as keyof FormValues]?.message)}
            </p>
          )}
        </div>
      ))}

      {/* MESSAGE */}
      <div className="relative">
        <textarea
          {...register("message", { required: "Message is required" })}
          rows={5}
          placeholder=" "
          className="
            w-full px-4 py-4 bg-white/10 dark:bg-black/10 
            border border-white-300 dark:border-gray-700
            text-gray-900 dark:text-white rounded-xl
            focus:outline-none focus:ring-2 focus:ring-blue-500 
            resize-none backdrop-blur-xl peer
            placeholder-transparent transition-all
          "
        ></textarea>
        <label
          className="
            absolute left-1 scale-75 peer-placeholder-shown:scale-100 peer-focus:scale-75 -top-[0.8rem] px-2 origin-left peer-placeholder-shown:top-2 peer-focus:-top-[0.8rem] peer-focus:text-blue-500 text-body transition-all pointer-events-none 
              dark:bg-gray-800/20 bg-white
          "
        >
          Message
        </label>
        {errors.message && (
          <p className="text-red-500 text-xs mt-2">
            {errors.message.message}
          </p>
        )}
      </div>

      {/* BUTTON */}
      <button
        type="submit"
        className="
          w-full py-3 rounded-xl font-semibold text-white 
          bg-blue-600 hover:bg-blue-700 active:scale-95 
          shadow-lg shadow-blue-500/30 transition-all cursor-pointer
        "
      >
        Send Message 🚀
      </button>
    </form>
  );
};
