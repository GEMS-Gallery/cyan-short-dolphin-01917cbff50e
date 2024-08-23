export const idlFactory = ({ IDL }) => {
  const Product = IDL.Record({
    'categories' : IDL.Text,
    'image_url' : IDL.Text,
    'name' : IDL.Text,
    'brand' : IDL.Text,
  });
  const Result = IDL.Variant({ 'ok' : Product, 'err' : IDL.Text });
  return IDL.Service({
    'lookupProduct' : IDL.Func([IDL.Text, Product], [Result], []),
    'scanBarcode' : IDL.Func([IDL.Text, Product], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
