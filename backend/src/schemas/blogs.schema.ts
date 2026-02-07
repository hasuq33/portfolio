import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Tags } from './tags.schema';
import { Partner } from './partner.schema';

export type BlogsDocument =  HydratedDocument<Blogs>

@Schema({timestamps:true,collection:'blogs'})
export class Blogs {
j
    @Prop({required:true})
    name:string

    @Prop({type:[{type:mongoose.Schema.Types.ObjectId, ref:'Tags'}],default:[]})
    tags: (Types.ObjectId | Tags)[];

    @Prop({maxlength:200,required:true})
    subtitle:string

    @Prop({required:true})
    content:string

    @Prop({type:[String],default:[]})
    keywords:string[]

    @Prop({})
    title:string

    @Prop({})
    description:string

    @Prop({required:true,default:false})
    isPublished:boolean

    @Prop({ required: false }) 
    backgroundImageUrl: string; 

    @Prop({type:mongoose.Schema.Types.ObjectId,ref:'partners'})
    author:Partner
}

export const BlogsSchema = SchemaFactory.createForClass(Blogs);