import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Product {
  'categories' : string,
  'image_url' : string,
  'name' : string,
  'brand' : string,
}
export type Result = { 'ok' : Product } |
  { 'err' : string };
export interface _SERVICE {
  'lookupProduct' : ActorMethod<[string], Result>,
  'scanBarcode' : ActorMethod<[string], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
