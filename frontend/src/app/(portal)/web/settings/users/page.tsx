'use client';
import { useState } from "react";

const page = () => {
  const [ view , setView ] = useState("list");
  
  return (
    <div>User page</div>
  )
}

export default page;