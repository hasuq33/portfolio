import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{logger:['error','warn','log','debug','verbose']});
  console.log("App Listen on this port: ",process.env.PORT)
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();