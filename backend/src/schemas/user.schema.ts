import { Prop , Schema , SchemaFactory } from '@nestjs/mongoose';
import { Partner, PartnerSchema } from './partner.schema';

@Schema()
export class User extends Partner{
    @Prop()
    password:string;

    @Prop({unique:true})
    login:string;
}

export const UserSchema =  SchemaFactory.createForClass(User);

PartnerSchema.discriminator('User',UserSchema);

