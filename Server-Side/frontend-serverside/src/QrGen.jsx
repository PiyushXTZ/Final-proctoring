import React, { useState } from "react";
import QRCode from "react-qr-code"; // ✅ Correct import

const QRGenerator = () => {
  const [data, setData] = useState(1); // Replace with dynamic data if needed
  const qrValue = `ff${data}`;

  return (
    <div className="flex flex-col items-center gap-4 mt-10">
      <h2 className="text-xl font-bold">QR Code Generator</h2>
      <QRCode value={qrValue} size={200} />
      <p className="text-lg">QR Data: {qrValue}</p>
    </div>
  );
};

export default QRGenerator;
