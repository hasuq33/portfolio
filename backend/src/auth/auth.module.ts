import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { User, UserSchema } from "../schemas/user.schema";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { UserSeeder } from "../seeder/user.seeder";
import { ConfigModule } from "@nestjs/config";


@Module({
    imports:[
        ConfigModule.forRoot(),
        MongooseModule.forFeature([{name:User.name,schema:UserSchema}]),
        JwtModule.register({
            secret:'super-scret',
            signOptions:{expiresIn:`${Number(process.env.MAX_AGE)*24*60*60*1000}s`}
        })
    ],
    providers:[AuthService,JwtAuthGuard,UserSeeder],
    controllers:[AuthController],
    exports:[AuthService,JwtModule,JwtAuthGuard]
})
export class AuthModule{};