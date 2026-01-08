'use client'
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { MailIcon } from "lucide-react";
import { MdVpnKey } from "react-icons/md";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React , { useState } from "react";
import DOMPurify from "dompurify";
import { useRouter } from "next/navigation";
import { ImCross } from "react-icons/im";

const page = () => {
  const [error, setError ] = useState<string>('');
  const router =  useRouter();
  const sanitize = (value:string)=>{
    return DOMPurify.sanitize(value,{ ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }

  const handleSubmit  = async (ev: React.FormEvent<HTMLFormElement>) =>{
    ev.preventDefault();
      const formData = new FormData(ev.currentTarget);
      const payload = {
        login:sanitize(formData.get("login") as string),
        password: sanitize(formData.get("password") as string),
        remember: formData.get("remember") === "on",
      }
      try {
       const res = await fetch("http://localhost:8000/auth/login",{
          method:"POST",
          credentials:"include",
          headers:{
             "Content-Type": "application/json",
          },
          body:JSON.stringify(payload)
        })
        if(!res.ok){
            setError("Login Failed");
            return
        }

        router.replace("/dashboard");
      } catch (error) {
        console.error(error);
      }
  }

  return (
    <div className="form-format flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-3xl dark:bg-gray-900 shadow-lg border p-6 space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">
            Login to continue to your account
          </p>
        </div>

        {/* Form */}
        <form method="post" onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <InputGroup>
            <InputGroupInput
              required
              type="text"
              name="login"
              placeholder="Email address"
            />
            <InputGroupAddon>
              <MailIcon className="h-4 w-4 text-muted-foreground" />
            </InputGroupAddon>
          </InputGroup>

          {/* Password */}
          <InputGroup>
            <InputGroupInput
              required
              type="password"
              name="password"
              placeholder="Password"
            />
            <InputGroupAddon>
              <MdVpnKey className="h-4 w-4 text-muted-foreground" />
            </InputGroupAddon>
          </InputGroup>

          {/* Remember + Reset */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="remember"
                className="h-4 w-4 rounded border-gray-300 accent-primary"
              />
              <span className="text-muted-foreground">Remember me</span>
            </label>

            <Link
              href="/web/reset-password"
              className="text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full rounded-xl">
            Login
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Don’t have an account?{" "}
          <Link
            href="/web/signup"
            className="text-primary font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
        {error && <p className="text-red-700 ht-flex-row-center gap-2"><ImCross/> {error}</p>}
      </div>
    </div>
  );
};

export default page;
