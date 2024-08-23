import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface BarcodeEntry { 'barcode' : string, 'timestamp' : bigint }
export type Result = { 'ok' : null } |
  { 'err' : string };
export interface _SERVICE {
  'getHistory' : ActorMethod<[], Array<BarcodeEntry>>,
  'recordBarcode' : ActorMethod<[string], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
