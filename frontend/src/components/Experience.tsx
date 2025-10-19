'use client';

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { journeyData } from "@/utils/constant";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

const Experience: React.FC = () => {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate timeline growth
      gsap.fromTo(
        ".timeline-line",
        { height: "0%" },
        {
          height: "100%",
          ease: "none",
          scrollTrigger: {
            trigger: timelineRef.current,
            start: "top center",
            end: "bottom center",
            scrub: true,
          },
          immediateRender:false
        }
      );

      // Animate items
      itemsRef.current.forEach((item) => {
        gsap.from(item, {
          opacity: 0,
          y: 50,
          duration: 0.8,
          scrollTrigger: {
            trigger: item,
            start: "top 80%",
            end: "bottom 60%",
            toggleActions: "play none none reverse",
          },
        });
      });
    }, timelineRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={timelineRef}
      className="relative flex flex-col items-center py-20 transition-colors duration-500 "
    >
      {/* Section Title */}
      <h2 className="text-4xl font-bold mb-16 text-center text-gray-900 dark:text-white">
        My Journey
      </h2>

      <div className="relative w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Central Timeline Line */}
        <div className="timeline-line absolute left-1/2 top-0 w-[3px] bg-gradient-to-b from-purple-500 to-blue-500 transform -translate-x-1/2 rounded-full h-0" />

        {/* Timeline Items */}
        <div className="space-y-28">
          {journeyData.map((item, index) => (
            <div
              key={item.id}
              ref={(el) => {
                if (el) itemsRef.current[index] = el;
              }}
              className={`relative flex flex-col sm:flex-row items-center ${
                index % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
              }`}
            >
              {/* Image Section */}
              <div className="sm:w-1/2 flex justify-center mb-6 sm:mb-0">
                <div className="relative group">
                  <div className=" bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full blur-lg opacity-30 group-hover:opacity-60 transition duration-300"></div>
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={400}
                    height={400}
                    quality={100}
                    className="relative w-40 h-40 object-cover rounded-full border-4 border-gray-300 dark:border-gray-800 shadow-xl transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </div>

              {/* Center Dot */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-r 
              from-purple-500 to-blue-500 rounded-full border-4 border-white dark:border-gray-900 
              shadow-md z-10 hidden lg:block" />

              {/* Text Section */}
              <div className="sm:w-1/2 sm:px-8">
                <div className="relative group overflow-hidden bg-gray-50 dark:bg-gray-900 p-6 
                rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 transition-colors 
                duration-300"
                onMouseMove={(ev)=>{
                  const card = ev.currentTarget;
                  const rect = card.getBoundingClientRect();
                  const x = ev.clientX - rect.left;
                  const y = ev.clientY- rect.top;

                  card.style.setProperty('--mouse-x',`${x}px`);
                  card.style.setProperty('--mouse-y',`${y}px`);

                  gsap.to(card, {
                    "--mouse-x": `${x}px`,
                    "--mouse-y": `${y}px`,
                    duration: 0.3,
                    ease: "power2.out",
                  });
                }}>
                  {/* Glowing Gradient follow the mouse*/}
                  <div 
                    className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 
                    transition-opacity duration-300"
                    style={{
                      background:`
                      radial-gradient(400px circle at var(--mouse-x) var(--mouse-y)
                      ,rgba(168, 85, 247, 0.15),rgba(59, 130, 246, 0.1),transparent 80%)
                      `
                    }}
                    />
                  <div className="relative z-10">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                      {item.title}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.date}
                    </span>
                    <p className="mt-3 text-gray-700 dark:text-gray-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;
