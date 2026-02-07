import Image from "next/image";
import { BlogFilter } from "@/components/BlogFilter";
import { Key, Search } from "lucide-react";
import { Input } from "@/components/ui/input";  
import Link from "next/link";
import { BlogSortFilter } from "@/components/BlogSortFilter";
import { BlogCard } from "@/components/BlogCard";
import { Blogs } from "@/utils/constant";
import { BlogViewSwitcher } from "@/components/BlogViewSwitcher";

export const generateMetadata = async () =>{
  return {
    "title":"Harshiv Blogs",
    "desciption": "Blogs Written By Harshiv Joshi. "
  }
}

const page = async ({searchParams}:{searchParams:{ [key: string]: string | string[] | undefined }}) => {
  let queryParams = await searchParams;
  const viewParam = queryParams?.display;
  const view: "grid" | "list" = viewParam === "list" ? "list" : "grid";

  return (
    <div className="min-h-screen py-24 px-4 md:px-24 bg-gray-50 dark:bg-gray-900 transition">
      <div className="w-[100%] mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Image Column */}
            <div className="rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/assets/office.avif"
                width={600}
                height={350}
                alt="Harshiv Blogs"
                className=" aspect-square object-cover lg:h-100 h-70 w-full"
                priority
              />
            </div>
          {/* Text Column */}
          <div>
              <h1 className="text-4xl font-bold mb-4">
              Technology Blogs
            </h1>
             <p className="text-gray-600 dark:text-white text-lg mb-6">
              Explore modern web development, backend systems, and
              scalable technologies written by Harshiv Joshi.
            </p>
             <div className="flex gap-4">
              <span className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm">
                Next.js
              </span>
              <span className="px-4 py-2 bg-gray-200 dark:text-black rounded-full text-sm">
                NestJS
              </span>
              <span className="px-4 py-2 bg-gray-200 dark:text-black rounded-full text-sm">
                MongoDB
              </span>
            </div>
          </div>
        </div>
        <div className="grid my-3 grid-cols-1 gap-10 items-center">

      <div className="flex items-stretch bg-white rounded-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 overflow-hidden lg:w-[40%] w-full ">
              
              {/* INPUT */}
              <Input
                type="search"
                placeholder="Search"
                className="
                  flex-1
                  border-0
                  bg-transparent
                  dark:bg-gray-900
                  dark:text-white
                  text-base
                  px-4
                  py-2
                  placeholder:text-gray-500
                  dark:placeholder:text-gray-400
                  focus-visible:ring-0
                  ring-0
                  dark:border-0
                  dark:focus-visible:ring-0
                "
              />
              
              {/* SEARCH BUTTON - YouTube Style */}
              <button
                className="
                  px-6
                  bg-gray-100
                  dark:bg-gray-800
                  hover:bg-gray-200
                  dark:hover:bg-gray-700
                  border-l
                  border-gray-300
                  dark:border-gray-600
                  transition-colors
                  flex
                  items-center
                  justify-center
                "
                aria-label="Search"
              >
                <Search 
                  size={20} 
                  className="text-gray-600 dark:text-gray-300" 
                />
              </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 lg:flex-row my-4 justify-between">
            <ul className="gap-10 flex flex-wrap  items-center">
              <li className="text-h5"><Link href="/blogs" >All</Link></li>
              <li className="text-h5"><Link href="/blogs">Topic1</Link></li>
              <li className="text-h5"><Link href="/blogs">Topic1</Link></li>
              <li className="text-h5"><Link href="/blogs">Topic1</Link></li>
              <li className="text-h5"><Link href="/blogs">Topic1</Link></li>
            </ul>
            <div className="flex justify-end gap-2">
              <BlogViewSwitcher view={view}/>
              <BlogSortFilter/>
              <BlogFilter/>  <div className="my-3">
        </div>
            </div>
        </div>
        <div className="grid grid-cols-12 gap-x-4">
          {
            Blogs.map((item)=>(
              <BlogCard className="my-3" view={view} key={item.id}/>
            ))
          }
        </div>
      </div>
    </div>
  )
}

export default page;