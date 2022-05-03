import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as Exception from "./exception";
export declare type Formatter<T> = {
    from: (json: any) => E.Either<Exception.t, T>;
    to: (obj: T) => any;
};
export declare class JsonFormatter<T> implements Formatter<T> {
    private readonly type;
    constructor(type: iot.Type<T, any>);
    from: (json: any) => E.Either<Exception.t, T>;
    to: (obj: T) => any;
}
