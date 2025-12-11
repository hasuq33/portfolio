import { Prop , Schema , SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type TagsDocuments =  HydratedDocument<Tags>

export class Tags{
    @Prop({required:true})
    name:string
}

export const TagsSchema = SchemaFactory.createForClass(Tags);