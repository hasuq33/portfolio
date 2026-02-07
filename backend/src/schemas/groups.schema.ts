import {Prop , Schema , SchemaFactory} from "@nestjs/mongoose";
import mongoose, { HydratedDocument , Types } from "mongoose";

export type GroupsDocument = HydratedDocument<Groups>;

@Schema({timestamps:true,collection:'groups'})
export class Groups {

    @Prop({required:true})
    name:string

    @Prop({type:[{type:mongoose.Schema.Types.ObjectId,ref:'Groups'}],default:[]})
    subGroups:(Types.ObjectId | Groups)[];
}

export const GroupsSchema = SchemaFactory.createForClass(Groups);