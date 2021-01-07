export declare class Extender {
    private _obj;
    private _proto;
    constructor(obj: any);
    Extend(newObj: any): Extender;
    Set(property: string, newObj: any, obj?: any): Extender;
    Map(property: string, newProperty: string): Extender;
}
