
import React, { useEffect, useRef } from "react";
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";

const EtiquetaPDF = ({ codigoBarras, precio, onGenerate }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (codigoBarras) {
      // Generar el código de barras en el canvas
      JsBarcode(canvasRef.current, codigoBarras, {
        format: "CODE128",
        displayValue: false, // No mostrar el valor debajo del código de barras
        width: 2,
        height: 50,
        margin: 0,
      });

      // Crear el PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [50, 30], // Tamaño de la etiqueta: 50mm x 30mm (ajusta según tus necesidades)
      });

      // Agregar el código de barras al PDF
      const barcodeDataURL = canvasRef.current.toDataURL("image/png");
      doc.addImage(barcodeDataURL, "PNG", 10, 10, 30, 15); // (x, y, width, height)

      // Agregar el precio debajo del código de barras
      doc.setFontSize(12);
      doc.text(`Bs. ${precio}`, 25, 28, { align: "center" }); // (texto, x, y, opciones)

      // Obtener el dataURL del PDF
      const pdfDataURL = doc.output("dataurlstring");

      // Pasar el dataURL al componente padre
      onGenerate(pdfDataURL);
    }
  }, [codigoBarras, precio, onGenerate]);

  return (
    <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
  );
};

export default EtiquetaPDF;
