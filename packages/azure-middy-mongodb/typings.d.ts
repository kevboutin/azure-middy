import { Connection, ConnectOptions } from "mongoose";

export interface MongoDBMiddlewareOptions extends ConnectOptions {
    serverSelectionTimeoutMS?: number;
}

export interface AzureFunctionRequest {
    internal?: {
        connection?: {
            [key: string]: any;
        };
    };
    [key: string]: any;
}

export interface MongoDBMiddleware {
    before: (request: AzureFunctionRequest) => Promise<void>;
}

export interface MongoDBConnection {
    changeDatabase: (
        conn: Connection,
        databaseName: string,
    ) => Promise<Connection>;
    disconnect: (conn: Connection) => Promise<Error | null>;
    mongodbMiddleware: (opts?: MongoDBMiddlewareOptions) => MongoDBMiddleware;
}
