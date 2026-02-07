import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{logger:['error','warn','log','debug','verbose']});
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.ALLOWED_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
  console.log("App Listen on this port: ",process.env.PORT)
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();