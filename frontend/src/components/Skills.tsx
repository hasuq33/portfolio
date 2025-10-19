'use client';
import * as React from "react"
import Image from "next/image"
import Autoplay from "embla-carousel-autoplay"

import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { SkillsIcons } from "@/utils/skills"

export function Skill() {
  return (
    <Carousel
      opts={{
        align: "end",
        loop: true,
      }}
      plugins={[
        Autoplay({
          delay: 4000,
        }),
      ]}
      className="mt-5"
    >
      <CarouselContent>
        {SkillsIcons.map((item, index) => (
          <CarouselItem key={index} className="flex justify-center basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6">
            <div className="p-1">
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 shadow-md hover:scale-105 transition-transform duration-300 ease-in-out rounded-2xl p-3 flex items-center justify-center h-[120px] sm:h-[140px] md:h-[160px] lg:h-[180px] w-[120px] sm:w-[140px] md:w-[160px] lg:w-[180px]">
                <CardContent className="flex items-center justify-center ">
                  <Image alt="Harshiv Python Skills" className=" h-20 w-20 object-contain" width={`100`} height="100" src={item.url}/>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
