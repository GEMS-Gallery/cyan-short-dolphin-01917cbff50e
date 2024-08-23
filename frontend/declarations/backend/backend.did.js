export const idlFactory = ({ IDL }) => {
  const BarcodeEntry = IDL.Record({
    'barcode' : IDL.Text,
    'timestamp' : IDL.Int,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  return IDL.Service({
    'getHistory' : IDL.Func([], [IDL.Vec(BarcodeEntry)], ['query']),
    'recordBarcode' : IDL.Func([IDL.Text], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
