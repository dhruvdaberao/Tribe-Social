// This declaration helps TypeScript understand the 'socket.io-client' module,
// which is loaded via an importmap instead of a local npm installation.
declare module 'socket.io-client' {
  // Provides a basic, typed interface for the Socket object based on its usage in the app.
  // FIX: Added generic constraints to ensure event maps are correctly typed as objects with function values.
  export interface Socket<
    ListenEvents extends Record<string, (...args: any[]) => void>,
    EmitEvents extends Record<string, (...args: any[]) => void>
  > {
    id: string;
    connected: boolean;
    auth: any;
    on<E extends keyof ListenEvents>(event: E, listener: ListenEvents[E]): this;
    off<E extends keyof ListenEvents>(event: E, listener?: ListenEvents[E]): this;
    emit<E extends keyof EmitEvents>(event: E, ...args: Parameters<EmitEvents[E]>): this;
    close(): this;
  }

  // Defines the `io` function that returns a Socket instance.
  // FIX: Made the `io` function generic to allow for strongly typed socket instances.
  export function io<
    ListenEvents extends Record<string, (...args: any[]) => void>,
    EmitEvents extends Record<string, (...args: any[]) => void>
  >(uri: string, options?: any): Socket<ListenEvents, EmitEvents>;
}
