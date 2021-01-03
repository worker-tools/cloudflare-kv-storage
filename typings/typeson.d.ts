declare module 'typeson' {
  export default class Typeson { 
    constructor(x?: any); 
    register(x: any): Typeson; 
    encapsulate(x: any): any;
    revive(x: any): any;
  }
}

declare module 'typeson-registry/dist/presets/structured-cloning-throwing' {}