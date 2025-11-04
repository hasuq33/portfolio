import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Mode } from "fs";
import { Connection , Model } from "mongoose";
import { retry } from "rxjs";

@Injectable()
export class CommonService{
    constructor(@InjectConnection() private readonly connection:Connection){}

    private getModel(modelName:string):Model<any>{
        const model = this.connection.model(modelName);
        if(!model) throw new Error(`Model '${modelName}' not found in Mongoose connection.`);

        return model;
    }

    async create(modelName:string, data:any){
        const model = this.getModel(modelName);
        const doc = new model(data);
        return doc.save();
    }

    async findAll(modelName: string, filter: any = {}){
        const model = this.getModel(modelName);
        return model.find(filter).exec();
    }

    async findById(modelName:string,id:string){
        const model = this.getModel(modelName);
        return model.findById(id).exec();
    }

    async update(modelName:string,id:string,data:any){
        const model =  this.getModel(modelName);
        return model.findByIdAndUpdate(id,data,{new:true}).exec();
    }

    async delete(modelName: string, id: string) {
        const model = this.getModel(modelName);
        return model.findByIdAndDelete(id).exec();
    }
}

