import { Module } from "@nestjs/common";
import { DatabaseModule } from "../config/databse.module";
import { CommonController } from "./common.controller";
import { CommonService } from "./common.service";
import { AuthModule } from "../auth/auth.module";

@Module({
    imports:[AuthModule , DatabaseModule],
    controllers:[CommonController],
    providers:[CommonService],
    exports:[CommonService]
})
export class CommonModule{}