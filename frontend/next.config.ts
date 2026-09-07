import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images:{
    qualities:[75,100],
    localPatterns: [
      { pathname: "/**", search: "" },
      { pathname: "/blog-images/**" },
    ],
  }
};

export default nextConfig;
