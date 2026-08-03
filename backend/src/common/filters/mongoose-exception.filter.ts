

import mongoose from 'mongoose'
import { Response } from 'express';
import { ArgumentsHost, Catch, ExceptionFilter , HttpException, HttpStatus } from "@nestjs/common";

interface MongoDuplicateKeyError extends Error {
    code: number;
    keyPattern?: Record<string, number>;
    keyValue?: Record<string, unknown>;
}

@Catch()
export class MongooseExceptionFilter implements ExceptionFilter{

    catch(exception: any, host: ArgumentsHost):void {
        const response =  host.switchToHttp().getResponse<Response>();

         /*
        * Preserve errors already raised by NestJS,
        * such as BadRequestException and NotFoundException.
        */
        if(exception instanceof HttpException){
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            response.status(status).json(
                typeof exceptionResponse === 'string' ? {
                    statusCode: status,
                    message: exceptionResponse
                }: exceptionResponse
            )

            return;
        }

        /*
        * Mongoose schema validation errors.
        */

        if(exception instanceof mongoose.Error.ValidationError){
            const errors = Object.values(exception.errors).map((error) => ({
                field: error.path,
                message: error.message,
                value: "value" in error ? error.value : undefined,
            }));

            response.status(HttpStatus.BAD_REQUEST).json({
                statusCode: HttpStatus.BAD_REQUEST,
                error: "Validation Error",
                message: "The submitted data is invalid.",
                errors,
            })

            return;
        }

        /*
        * Invalid ObjectId, number, date, boolean, etc.
        */
        if (exception instanceof mongoose.Error.CastError) {
        response.status(HttpStatus.BAD_REQUEST).json({
            statusCode: HttpStatus.BAD_REQUEST,
            error: "Cast Error",
            message: `Invalid value supplied for field '${exception.path}'.`,
            field: exception.path,
            value: exception.value,
            expectedType: exception.kind,
        });

        return;
        }

        /*
        * Model was requested before being registered.
        */
        if (exception instanceof mongoose.Error.MissingSchemaError) {
        response.status(HttpStatus.NOT_FOUND).json({
            statusCode: HttpStatus.NOT_FOUND,
            error: "Model Not Found",
            message: exception.message,
        });

        return;
        }

        /*
        * DocumentNotFoundError only occurs when an operation
        * explicitly uses orFail(). Normal findById() returns null.
        */
        if (exception instanceof mongoose.Error.DocumentNotFoundError) {
        response.status(HttpStatus.NOT_FOUND).json({
            statusCode: HttpStatus.NOT_FOUND,
            error: "Not Found",
            message: "The requested record was not found.",
        });

        return;
        }

        /*
        * MongoDB duplicate unique-index error.
        */
        if (this.isDuplicateKeyError(exception)) {
        response.status(HttpStatus.CONFLICT).json({
            statusCode: HttpStatus.CONFLICT,
            error: "Duplicate Record",
            message: this.getDuplicateMessage(exception),
            fields: Object.keys(exception.keyPattern ?? {}),
            values: exception.keyValue ?? {},
        });

        return;
        }

        /*
        * Unknown errors should not expose internal stack traces
        * or database details to the client.
        */
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: "Internal Server Error",
        message: "An unexpected error occurred.",
        });
    }

    private isDuplicateKeyError(exception:unknown): exception is MongoDuplicateKeyError{
        return (
        exception instanceof Error &&
        "code" in exception &&
        exception.code === 11000
        )
    }

     private getDuplicateMessage(error: MongoDuplicateKeyError): string {
        const fields = Object.keys(error.keyValue ?? {});

        if (!fields.length) {
        return "A record with the same unique value already exists.";
        }

        return `A record with the same ${fields.join(", ")} already exists.`;
    }
}