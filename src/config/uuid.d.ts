declare module 'uuid' {
  export function v1(options?: any): string;
  export function v3(options?: any): string;
  export function v4(options?: any): string;
  export function v5(options?: any): string;
  export function NIL(options?: any): string;
  export function validate(uuid: string): boolean;
  export function version(uuid: string): number;
}
