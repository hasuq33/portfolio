import React from 'react';

import { ThemeToggler } from './ThemeToggler';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

 const Header = () => {
  return (
    <div className=' flex justify-center border-grid sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='p-3 flex flex-row justify-between w-[1024px]'>
          <ul className='flex  flex-row items-center'>
              <li className='mx-2'><Link href="/">Home</Link></li>
              <li className='mx-2'><Link href="/">Resume</Link></li>
              <li className='mx-2'><Link href="/contact">Contact</Link></li>
              <li className='mx-2'><Link href="/blogs">Blogs</Link></li>
          </ul>
          <div className='flex align-center gap-3'>
          <Button className='mr-2'>Login</Button>
          <ThemeToggler />
          </div>
      </div>
    </div>
  )
}

export default Header;
