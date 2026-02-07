

export class AppError extends Error {
    status: number;
    title?: string;

    constructor(message:string,status=500,title?:string){
        super(message);
        this.name = "AppError";
        this.status =  status;
        this.title = title;

        Object.setPrototypeOf(this,AppError.prototype);
    }

    
}