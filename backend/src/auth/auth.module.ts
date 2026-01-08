import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { User, UserSchema } from "../schemas/user.schema";
import { JwtAuthGuard } from "./jwt-auth.guard";


@Module({
    imports:[
        MongooseModule.forFeature([{name:User.name,schema:UserSchema}]),
        JwtModule.register({
            secret:'super-scret',
            signOptions:{expiresIn:'1h'}
        })
    ],
    providers:[AuthService,JwtAuthGuard],
    controllers:[AuthController],
    exports:[AuthService,JwtModule,JwtAuthGuard]
})
export class AuthModule{};