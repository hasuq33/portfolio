import { Prop , Schema , SchemaFactory } from '@nestjs/mongoose';
import { Partner, PartnerSchema } from './partner.schema';

@Schema({timestamps:true,collection:'users'})
export class User extends Partner{
    @Prop()
    password:string;

    @Prop({unique:true,required: true})
    login:string;
}

export const UserSchema =  SchemaFactory.createForClass(User);