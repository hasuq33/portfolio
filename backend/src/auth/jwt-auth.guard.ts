import { JwtService } from '@nestjs/jwt';
import { Injectable , CanActivate , ExecutionContext , UnauthorizedException } from "@nestjs/common";
import { InjectModel } from '@nestjs/mongoose';
import { Model } from "mongoose";
import { User } from "../schemas/user.schema";

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(@InjectModel(User.name) private readonly userModel: Model<User>,private readonly  jwtService:JwtService){};

     async canActivate(context: ExecutionContext){
        const req =  context.switchToHttp().getRequest();
        const cookies = req.cookies;
        console.log(cookies);
        if(!cookies){
            throw new UnauthorizedException("Missing Authoization Header");
        }

        const token = cookies.access_token;
        if(!token){
            throw new UnauthorizedException('Invalid token format');
        }

        try {
            const payload = this.jwtService.verify(token);
            const { login } = payload;
            if(!login) throw  new UnauthorizedException('Invalid User!'); 
            const user = await this.userModel.findOne({login:login});
            req.user = user;
            return Boolean(user);
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token!');
        }
    }
}