import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {  User } from "../schemas/user.schema";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import bcrypt from "bcrypt";

@Injectable()
export class UserSeeder implements OnModuleInit{
    private readonly logger = new Logger(UserSeeder.name);

    constructor(@InjectModel(User.name) private readonly  userModel: Model<User>){}

    async onModuleInit() {
        const count = await this.userModel.countDocuments();

        if(count>0){
            this.logger.log("Users already exist. Skipping seeding.");
            return;
        }

        this.logger.warn("No users found. Creating demo user...");

        await this.userModel.create({
            login: "admin",
            email: "admin@example.com",
            password: await bcrypt.hash("admin", 10),
            companyName: "My Company",
        });

        this.logger.log("Demo user created successfully.");
    }
}

