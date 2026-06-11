import React from "react";

const CafeReceipt = () => {
  const items = [
    {
      name: "Cappuccino",
      qty: 1,
      price: 21.0,
    },
    {
      name: "Latte",
      qty: 1,
      price: 19.0,
    },
    {
      name: "Chocolate Muffin",
      qty: 1,
      price: 15.0,
    },
  ];

  const total = items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const cash = 100;
  const change = cash - total;

  return (
    <div
      style={{
        width: "380px",
        margin: "20px auto",
        padding: "20px",
        background: "#fff",
        fontFamily: "Arial, sans-serif",
        color: "#000",
        border: "1px solid #ddd",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{ margin: "0" }}>Coffee-Shop</h1>
        <p>Lorem ipsum 258</p>
        <p>City Index - 02025</p>
        <p>Tel: +456-468-987-02</p>
      </div>

      <hr
        style={{
          borderTop: "2px dotted #000",
          margin: "20px 0",
        }}
      />

      {/* Store Info */}
      <div>
        <p>
          <strong>Store:</strong> 25896
          <span style={{ float: "right" }}>
            02-05-2023 11:20 AM
          </span>
        </p>
        <p>
          <strong>Server:</strong> NY 58/8
        </p>
        <p>
          <strong>Survey code:</strong>
          0000-2555-2588-4545-69
        </p>
      </div>

      <hr
        style={{
          borderTop: "2px dotted #000",
          margin: "20px 0",
        }}
      />

      {/* Items */}
      <table width="100%">
        <thead>
          <tr>
            <th align="left">Name</th>
            <th align="center">Qty</th>
            <th align="right">Price</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td align="center">{item.qty}</td>
              <td align="right">
                ${item.price.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr
        style={{
          borderTop: "2px dotted #000",
          margin: "20px 0",
        }}
      />

      {/* Total */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      >
        <span>Price</span>
        <span>${total.toFixed(2)}</span>
      </div>

      <div style={{ marginTop: "20px" }}>
        <p>
          CASH
          <span style={{ float: "right" }}>
            ${cash.toFixed(2)}
          </span>
        </p>
        <p>
          CHANGE
          <span style={{ float: "right" }}>
            ${change.toFixed(2)}
          </span>
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          marginTop: "30px",
        }}
      >
        <hr
          style={{
            width: "50%",
            borderTop: "2px dotted #000",
          }}
        />
        <h2>THANK YOU!</h2>

        {/* Barcode Placeholder */}
        <div
          style={{
            height: "80px",
            background:
              "repeating-linear-gradient(90deg,#000,#000 2px,#fff 2px,#fff 4px)",
            marginTop: "20px",
          }}
        />
      </div>
    </div>
  );
};

export default CafeReceipt;