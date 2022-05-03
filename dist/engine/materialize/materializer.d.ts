import * as Plan from "./plan";
import { Transaction } from "../../model";
import { Rule } from "../../model";
export declare type Conflict = {
    _type: "Conflict";
    element: Transaction.Internal.t;
    rules: Rule.Internal.Rule[];
};
export declare type Tagged = {
    _type: "Tagged";
    tag: string;
    element: Transaction.Internal.t;
};
export declare type Untagged = {
    _type: "Untagged";
    element: Transaction.Internal.t;
};
export declare type TaggedSet = {
    _type: "TaggedSet";
    elements: Tagged[];
};
export declare type Element = Conflict | TaggedSet | Untagged;
export declare type Flow = (transaction: Transaction.Internal.t) => Element;
export declare const build: (stage: Plan.Stage) => Flow;
