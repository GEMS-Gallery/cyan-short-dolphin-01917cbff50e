import Array "mo:base/Array";
import Hash "mo:base/Hash";

import Text "mo:base/Text";
import Error "mo:base/Error";
import Option "mo:base/Option";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Blob "mo:base/Blob";

actor {
  type Product = {
    name: Text;
    brand: Text;
    categories: Text;
    image_url: Text;
  };

  stable var productEntries : [(Text, Product)] = [];
  var productCache = HashMap.fromIter<Text, Product>(productEntries.vals(), 0, Text.equal, Text.hash);

  public func lookupProduct(barcode: Text, productData: Product) : async Result.Result<Product, Text> {
    switch (productCache.get(barcode)) {
      case (?cachedProduct) { #ok(cachedProduct) };
      case null {
        productCache.put(barcode, productData);
        #ok(productData)
      };
    };
  };

  public func scanBarcode(barcode: Text, productData: Product) : async Result.Result<Product, Text> {
    await lookupProduct(barcode, productData)
  };

  system func preupgrade() {
    productEntries := Iter.toArray(productCache.entries());
  };

  system func postupgrade() {
    productCache := HashMap.fromIter<Text, Product>(productEntries.vals(), 0, Text.equal, Text.hash);
  };
}
