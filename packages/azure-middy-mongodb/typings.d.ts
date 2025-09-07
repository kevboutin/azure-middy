import { Connection, ConnectOptions } from "mongoose";

export interface MongoDBMiddlewareOptions extends ConnectOptions {
    readonly serverSelectionTimeoutMS?: number;
}

export interface AzureFunctionRequest {
    readonly internal?: {
        readonly connection?: Record<string, unknown>;
    };
    [key: string]: unknown;
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
