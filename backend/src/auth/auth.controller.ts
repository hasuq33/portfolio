import { Controller , Post , Body, Res, HttpCode, HttpStatus , Logger, Get, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import type { Response , Request } from "express";

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
            maxAge: Number(process.env.MAX_AGE)*60*1000 ,
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

    @Get('user')
    @HttpCode(HttpStatus.OK)
    async getuser(@Req() request:Request){
        const allCookies =  request.cookies;
        const { access_token } = allCookies
        const user = await this.authService.getCurrentUser(access_token);
        console.log(user)
        return user; 
    }
}