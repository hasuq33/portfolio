import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Mode } from "fs";
import { Connection , Model , SortOrder } from "mongoose";
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

    private domainToMongo(domain:[string,string,any][]){
        const filter: any = {};

        for(const [field,operator,value] of domain){
            switch(operator){
                case "=":
                    filter[field] = value; 
                    break;
                case "!=":
                    filter[field] = { $ne:value };
                    break;
                case ">":
                    filter[field] = { $gt:value };
                    break;
                case "<":
                    filter[field] = { $lt:value };
                    break;
                case ">=":
                    filter[field] = { $gte: value };
                    break;
                case "<=":
                    filter[field] = { $lte: value };
                    break;

                case "in":
                    filter[field] = { $in: value };
                    break;

                case "not in":
                    filter[field] = { $nin: value };
                    break;
                default:
                    throw new Error(`Unsupported domain operator: ${operator}`);
            }
            return filter;
        }
    }

    private orderToMongo(order:string): Record<string,SortOrder>{
        if(!order) return {};
        const sort: Record<string,SortOrder> = {};
        const parts =  order.split(",");

        for(const  part of parts){
            const trimmed =  part.trim();
            if(!trimmed) continue;
            const [field , direction ] = trimmed.split(/\s+/);

            sort[field] =  direction.toLowerCase() === "desc" ? -1 : 1; 
            
        }

        return sort;
    }

    async searchRead(
        modelName:string,
        options:{
            domain?: [string, string, any][];
            order?: string;
            limit?: number;
            offset?: number;
            fields?: string[];
        }){

            const model = this.getModel(modelName);
            const { domain=[],order="createdAt desc",limit=20,offset=0,fields= [] } = options;

            const filter =  this.domainToMongo(domain);
            const sort  = this.orderToMongo(order);

            const query = model.find(filter);
            
            if(fields.length){
                query.select(fields.join(" "));
            }

            query.sort(sort).skip(offset).limit(limit);
            return query.exec();
        }
}

