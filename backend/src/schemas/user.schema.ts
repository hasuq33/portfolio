import { Prop , Schema , SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({timestamps:true,collection:'users'})
export class User{
    @Prop()
    password:string;

    @Prop({unique:true,required: true})
    login:string;

    @Prop({type: Types.ObjectId,ref:"Partner"})
    partnerId:Types.ObjectId;

    @Prop()
    name:string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    email: string;

    @Prop({ required: true, trim: true })
    companyName: string;

    @Prop({ trim: true })
    phone?: string;

    @Prop({trim:true})
    zip?:string;

    @Prop({ trim: true })
    address?: string;

    @Prop({ type: String, enum: ['active', 'inactive'], default: 'active' })
    status: 'active' | 'inactive';

    @Prop({ type: [String], default: [] })
    tags: string[];

    @Prop({ default: false })
    isVerified: boolean;

    @Prop()
    website?: string;

    @Prop({ type: Date })
    joinedAt?: Date;
}

export const UserSchema =  SchemaFactory.createForClass(User);