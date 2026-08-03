import { Controller, Post , Put , Delete , Param , Body , Logger } from "@nestjs/common";
import { CommonService } from "./common.service";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

// Common API Model Sharable which Can be Scallable by Model and Need to find the Data by accessrigght 
/**
 * I am gonna implement the Controller API as Like SmartMiddleare which use Groups 
 * with authentication 
 * 
 * Web Request ---> Authentication middleware --> Check Group --> Fetch Data 
 */
@UseGuards(JwtAuthGuard)
@Controller('api/:model')
export class CommonController{
    constructor(private readonly commonService:CommonService){}
    private readonly logger = new Logger(CommonController.name);

    @Post()
    async create(@Param('model') model:string, @Body() data:any){
        this.logger.log(`api/${model}`)
        return this.commonService.create(model, data);
    }

    @Post("search")
    async searchRead(
        @Param("model") model:string,
        @Body() body:{
            domain?: [string, string, any][];
            order?: string;
            limit?: number;
            offset?: number;
            fields?: string[];
        }
    ){
        this.logger.log(`SEARCH api/${model}`);
        return this.commonService.searchRead(model,body);
    }

    @Post("read")
    async read(
        @Param("model") model:string,
        @Body("id") id: string,
    ){
        this.logger.log(`READ api/${model}/${id}`);
        return this.commonService.findById(model,id);
    }

    @Put(':id')
    async update(
        @Param('model') model:string,
        @Param('id') id:string,
        @Body() data:any 
    ){
        return this.commonService.update(model,id,data);
    }

    @Delete(':id')
    async delete(@Param('model') model:string, @Param('id') id:string){
        return this.commonService.delete(model, id );
    }
}