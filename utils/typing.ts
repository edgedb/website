export type PromiseType<P> = P extends Promise<infer A> ? A : P;

export type ElementType<T extends any[]> = T extends (infer U)[] ? U : never;
