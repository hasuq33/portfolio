import { Controller, Get, Post , Put , Delete , Param , Body , Query } from "@nestjs/common";
import { CommonService } from "./common.service";

@Controller('api/:model')
export class CommonController{
    constructor(private readonly commonService:CommonService){}

    @Post()
    async create(@Param('model') model:string, @Body() data:any){
        return this.commonService.create(model, data);
    }

    @Get()
    async findAll(@Param('model') model:string, @Query() query:any){
        return this.commonService.findAll(model,query);
    }
    
    @Get(':id')
    async findOne(@Param('model') model: string, @Param('id') id: string) {
        return this.commonService.findById(model, id);
    }

    @Put(':id')
    async update(
        @Param('model') model:string,
        @Param('id') id:string,
        @Body() data:any 
    ){
        return this.commonService.update(model,id,data);
    }

    @Delete('id')
    async delete(@Param('model') model:string, @Param('id') id:string){
        return this.commonService.delete(model, id );
    }
}