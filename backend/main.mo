import Int "mo:base/Int";
import Time "mo:base/Time";

import Text "mo:base/Text";
import Array "mo:base/Array";
import Result "mo:base/Result";

actor {
  type BarcodeEntry = {
    barcode: Text;
    timestamp: Int;
  };

  var barcodeHistory : [BarcodeEntry] = [];

  public func recordBarcode(barcode: Text) : async Result.Result<(), Text> {
    let entry : BarcodeEntry = {
      barcode = barcode;
      timestamp = Time.now();
    };
    barcodeHistory := Array.append(barcodeHistory, [entry]);
    #ok(())
  };

  public query func getHistory() : async [BarcodeEntry] {
    barcodeHistory
  };
}
