import { Injectable , UnauthorizedException } from "@nestjs/common";
import { User } from "../schemas/user.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import bcrypt from 'bcrypt';
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService{

    constructor(@InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService:JwtService){}

    async signup(data:any){
        const hashed =  await bcrypt.hash(data.password,10);
        const user = await this.userModel.create({
            login:data.login,
            password: hashed,
            email:data.email,
            companyName:data.companyName
        })

        return {message:'Signup Successfull',userId:user._id};
    }

    async login(data:any){
        const user = await this.userModel.findOne({login:data.login});
        if(!user) throw new UnauthorizedException();

        const valid = await bcrypt.compare(data.password,user.password);
        if(!valid) throw new UnauthorizedException();

        const token = this.jwtService.sign({
            sub:user._id,
            login:user.login
        })

        return {access_token:token};
    }

    async resetPassword(data:any){
        const hashed = await bcrypt.hash(data.newPassword,10);
        await this.userModel.updateOne({login:data.login},{password:hashed}); 
        return { message: 'Password reset successful!' };
    }

    async validateUser(login:string,password:string){
        const user = await this.userModel.findOne({login});

        if(!user){
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
         if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return user;
    }
}