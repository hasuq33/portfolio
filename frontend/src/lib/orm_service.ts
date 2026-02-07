import { emitGlobalError } from "./error-event";
import { AppError } from "./error";

interface fetchOptions {
    url: string, 
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    payload?:BodyInit,
    headers?:HeadersInit,
}

export const apiFetch = async ({url,method="GET",payload,headers}:fetchOptions)=>{
    try {
       const res =  await fetch(process.env.NEXT_PUBLIC_BACKEND_URL+url,{
            method:method,
            credentials:"include",
            headers:headers,
            body:payload
        })

        if(!res.ok){
            let message ='Something went wrong!';

            try {
                const data = await res.json();
                message =  data.message?? message;
            } catch (error) {}

            const error = new AppError(message,res.status,"Request Failed");

            // Let's emit the global error
            if(typeof window !== undefined){
                emitGlobalError({
                    title:error.title,
                    message:error.message,
                    status:error.status
                })
            }
        }
        return  res
    } catch (error) {
       let test =  new AppError("Connection Failed",500,"Network Failed!")

        // Let's emit the global error
            if(typeof window !== undefined){
                emitGlobalError({
                    title:test.title,
                    message:test.message,
                    status:test.status
                })
            }
    }
}