type Writer = (savedObject: string | undefined) => string;

export type Passthrough = {
  putObject: (writeFunc: Writer) => (path: string) => Promise<any>;
  getObject: (path: string) => Promise<any>;
  listObjects: (path: string) => Promise<any>;
}

/*export class FilePassthrough implements Passthrough {
  
}*/
