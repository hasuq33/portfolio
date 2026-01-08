import { JwtService } from '@nestjs/jwt';
import { Injectable , CanActivate , ExecutionContext , UnauthorizedException } from "@nestjs/common";

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly  jwtService:JwtService){};

    canActivate(context: ExecutionContext): boolean{
        const req =  context.switchToHttp().getRequest();
        const cookies = req.cookies;
        console.log(req.cookies);
        if(!cookies){
            throw new UnauthorizedException("Missing Authoization Header");
        }

        const token = cookies.access_token.access_token;
        if(!token){
            throw new UnauthorizedException('Invalid token format');
        }

        try {
            const payload = this.jwtService.verify(token);
            req.user =  payload;
            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token!');
        }
    }
}