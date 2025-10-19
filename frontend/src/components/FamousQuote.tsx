'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-creative';
import { EffectCreative , Autoplay } from 'swiper/modules';
import Image from 'next/image';
import React from 'react';
import { quotes } from '@/utils/constant';

const FamousQuote: React.FC = () => {
  return (
    <section className="relative py-16  transition-colors duration-500">

      <Swiper
        grabCursor={true}
        effect={'creative'}
        autoplay={{delay:5000,disableOnInteraction: false}}
        loop={true}
        creativeEffect={{
          prev: {
            shadow: true,
            translate: [0, 0, -400],
          },
          next: {
            translate: ['100%', 0, 0],
          },
        }}
        modules={[EffectCreative, Autoplay]}
        className="mySwiper max-w-4xl mx-auto"
      >
        {quotes.map((q) => (
          <SwiperSlide key={q.id}>
            <div
              className={`relative overflow-hidden rounded-2xl p-[2px] bg-gradient-to-r ${q.color} shadow-xl group`}
            >
              {/* Inner Card */}
              <div className="relative bg-gray-50 dark:bg-gray-900 rounded-2xl p-10 flex flex-col md:flex-row items-center gap-6 transition-transform duration-500 ">
                
                {/* Profile Image */}
                <div className="relative flex-shrink-0">
                  <div className="absolute  bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full blur-md opacity-30 group-hover:opacity-60 transition-all duration-500"></div>
                  <Image
                    src={q.image}
                    alt={q.name}
                    width={160}
                    height={160}
                    className="relative z-10 w-40 h-40 object-cover rounded-full border-4 border-gray-300 dark:border-gray-800 shadow-lg"
                  />
                </div>

                {/* Quote Content */}
                <div className="flex-1 text-center md:text-left">
                  <p className="text-lg italic text-gray-700 dark:text-gray-300 leading-relaxed">
                    “{q.quote}”
                  </p>
                  <h3 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-white">
                    — {q.name}
                  </h3>
                </div>

              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default FamousQuote;
