import { GLOBAL_ERROR_EVENT } from "./error-event";
let intialized = false;

export const initGlobalErrorListner = (()=>{
    return () =>{
        if(intialized) return;
        intialized = true;

        window.addEventListener(GLOBAL_ERROR_EVENT,(event:Event)=>{
            const customEvent = event as CustomEvent;
            console.log("Global error received:", customEvent.detail);
        })
    }
})