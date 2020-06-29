export class File {
    readonly filePath:string;
    readonly comments: any[];
    constructor(filePath : string) {
        this.filePath = filePath;
    }
}
