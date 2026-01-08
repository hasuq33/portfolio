import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { PartnerSchema , UserSchema , LeadSchema , TagsSchema , BlogsSchema } from "../schemas";

import 'dotenv/config';
const MONGODB_URI = process.env.MONGODB_URI as string

@Module({
    imports:[
        MongooseModule.forRootAsync({
            useFactory: async ()=>{
                mongoose.connection.on('connected', () => {
                console.log('✅ MongoDB connected successfully!');
                });

                mongoose.connection.on('error', (err) => {
                console.error('❌ MongoDB connection error:', err);
                });
                return {
                    uri: MONGODB_URI
                }
            }
        }),
        MongooseModule.forFeature([
            { name: 'Partner', schema: PartnerSchema },
            {name:'Lead',schema:LeadSchema},
            {name:'Tags',schema:TagsSchema},
            {name:"Blogs",schema:BlogsSchema}
        ])
    ],
    exports:[MongooseModule]
})
export class DatabaseModule{
}