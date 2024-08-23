import Array "mo:base/Array";
import Func "mo:base/Func";
import Hash "mo:base/Hash";

import Text "mo:base/Text";
import Error "mo:base/Error";
import Option "mo:base/Option";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";

actor {
  // Define the Product type
  type Product = {
    name: Text;
    brand: Text;
    categories: Text;
    image_url: Text;
  };

  // Create a stable variable for caching products
  stable var productEntries : [(Text, Product)] = [];
  var productCache = HashMap.fromIter<Text, Product>(productEntries.vals(), 0, Text.equal, Text.hash);

  // Function to lookup product information
  public func lookupProduct(barcode: Text) : async Result.Result<Product, Text> {
    switch (productCache.get(barcode)) {
      case (?cachedProduct) {
        // Return cached product if available
        #ok(cachedProduct)
      };
      case null {
        // Simulate API call to fetch product information
        // In a real scenario, you would make an HTTP request to the OpenFoodFacts API
        let product : Product = {
          name = "Sample Product";
          brand = "Sample Brand";
          categories = "Sample Category";
          image_url = "https://example.com/sample-image.jpg";
        };

        // Cache the product
        productCache.put(barcode, product);

        #ok(product)
      };
    };
  };

  // Function to scan barcode and return product information
  public func scanBarcode(barcode: Text) : async Result.Result<Product, Text> {
    await lookupProduct(barcode)
  };

  // For upgrading: convert the HashMap to an array
  system func preupgrade() {
    productEntries := Iter.toArray(productCache.entries());
  };

  // For upgrading: reconstruct the HashMap from the array
  system func postupgrade() {
    productCache := HashMap.fromIter<Text, Product>(productEntries.vals(), 0, Text.equal, Text.hash);
  };
}
