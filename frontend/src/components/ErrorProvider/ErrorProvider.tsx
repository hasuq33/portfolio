"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GLOBAL_ERROR_EVENT } from "@/lib/error-event";

type ErrorState = {
    title?:string,
    message:string
}

export const ErrorProvider = ()=>{
    const [error,setError] = useState<ErrorState | null>(null);

    useEffect(()=>{
        const handler = (ev:Event) =>{
            const customEvent = ev as CustomEvent<ErrorState>;
            setError(customEvent.detail);
        }
        window.addEventListener(GLOBAL_ERROR_EVENT,handler); 

        return ()=> window.removeEventListener(GLOBAL_ERROR_EVENT,handler);
    },[]);

    return (
    <Dialog open={!!error} onOpenChange={() => setError(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{error?.title ?? "Error"}</DialogTitle>
          <DialogDescription>{error?.message}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Button onClick={() => setError(null)}>OK</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}