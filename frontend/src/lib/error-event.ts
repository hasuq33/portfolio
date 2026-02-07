export type GlobalErrorPayload = {
    title?:string,
    message?:string,
    status?:number,
}

export const GLOBAL_ERROR_EVENT = "app:error";

export function emitGlobalError(payload:GlobalErrorPayload){
    window.dispatchEvent(new CustomEvent<GlobalErrorPayload>(GLOBAL_ERROR_EVENT,{
        detail:payload,
    }))
}