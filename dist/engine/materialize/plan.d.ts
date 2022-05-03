import { Account, Rule } from "../../model";
export declare type SplitStage = {
    _type: "SplitStage";
    tag: string;
    attach: Rule.Internal.Attach.t[];
    split: Rule.Internal.Split.t[];
};
export declare type IncludeStage = {
    _type: "IncludeStage";
    tag: string;
    attach: Rule.Internal.Attach.t[];
    include: Rule.Internal.Include.t[];
    children: string[];
};
export declare type Stage = SplitStage | IncludeStage;
export declare type t = {
    stages: Stage[];
};
export declare const build: (accounts: Account.Internal.Rich[]) => t;
