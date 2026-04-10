import { Prop , Schema , SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PartnerDocument  = HydratedDocument<Partner>

@Schema({
    timestamps:true,
    collection:'partners'
})
export class Partner{
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

    @Prop({ type: [String], default: [] })
    tags: string[];

    @Prop()
    website?: string;
}

export const PartnerSchema = SchemaFactory.createForClass(Partner);

