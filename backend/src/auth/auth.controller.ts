import { Controller , Post , Body, Res, HttpCode, HttpStatus , Logger } from "@nestjs/common";
import { AuthService } from "./auth.service";
import type { Response } from "express";

@Controller('auth')
export class AuthController{
    private readonly logger = new Logger(AuthController.name);
    constructor(private readonly authService:AuthService){}

    @Post('signup')
    @HttpCode(HttpStatus.CREATED)
    signup(@Body() data:any){
        console.log(data);
        return this.authService.signup(data);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() data:any, @Res({ passthrough: true }) res:Response){
        const {access_token} = await this.authService.login(data);

        res.cookie('access_token', access_token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000 ,
            path:'/'
        });
        this.logger.log('/auth/login Susccessully called!')
        return { message: 'Login successful' };
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    resetPassword(@Body() data:any){
        return this.authService.resetPassword(data);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    logout(@Res({passthrough:true}) res:Response){
        res.clearCookie('access_token');
        return {message: 'Logged out successfully'}
    }
}