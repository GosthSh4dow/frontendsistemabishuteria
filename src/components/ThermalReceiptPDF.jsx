// src/components/ThermalReceiptPDF.jsx
import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';

const ThermalReceiptPDF = ({ venta, detallesVenta, cliente, noReceipt }) => {
  const [pdfData, setPdfData] = useState(null);

  useEffect(() => {
    generarPDF();
  }, []);

  const generarPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200]
    });

    doc.setFont('courier', 'normal');
    doc.setFontSize(10);

    // Considerando ~32 caracteres de ancho (aprox) en fontSize=10 courier
    // Ajustamos las columnas:
    // Producto: 12 chars, Cant: 4 chars, P.U: 6 chars, Subt: 8 chars
    // Total ancho: 12+1+4+1+6+1+8 = 33 chars aprox. Está bien para 80mm.
    const colProducto = 12;
    const colCant = 4;
    const colPU = 6;
    const colSubt = 8;

    const centerX = 40; // Para centrar texto
    let currentY = 10;

    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.text(venta.sucursal_nombre.substring(0, 20), centerX, currentY, { align: 'center' });
    currentY += 5;
    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    doc.text(venta.sucursal_direccion.substring(0, 30), centerX, currentY, { align: 'center' });
    currentY += 10;

    doc.text(`Fecha: ${new Date(venta.fecha).toLocaleString()}`, 5, currentY);
    currentY += 5;

    if (!noReceipt) {
      const clienteNombre = (cliente?.nombre_completo || "Sin Nombre").substring(0,30);
      doc.text(`Cliente: ${clienteNombre}`, 5, currentY);
      currentY += 5;
    }

    // Dibujar tabla ASCII
    // Encabezado
    const header = pad('Producto', colProducto) + ' ' + pad('Cant', colCant) + ' ' + pad('P.U', colPU) + ' ' + pad('Subt', colSubt);
    doc.text(header, 5, currentY);
    currentY += 5;

    doc.text('-'.repeat(33), 5, currentY);
    currentY += 5;

    // Filas de detalle
    detallesVenta.forEach((detalle) => {
      const prodName = (detalle.producto.nombre || "").substring(0,colProducto);
      const cantStr = detalle.cantidad.toString().substring(0,colCant);
      const pu = Number(detalle.precio_unitario||0).toFixed(2);
      const subt = Number(detalle.subtotal||0).toFixed(2);

      const line = pad(prodName, colProducto) + ' ' + pad(cantStr, colCant, true) + ' ' + pad(pu, colPU, true) + ' ' + pad(subt, colSubt, true);
      doc.text(line, 5, currentY);
      currentY += 5;
    });

    doc.text('-'.repeat(33), 5, currentY);
    currentY += 5;

    doc.setFont('courier', 'bold');
    doc.text(`Total: Bs. ${Number(venta.monto_total||0).toFixed(2)}`, 5, currentY);
    currentY += 10;

    doc.setFont('courier', 'normal');
    // Reemplaza la línea de agradecimiento para que esté centrada y en una sola línea
    doc.text(`¡Gracias por su preferencia! :-) `, centerX, currentY, { align: 'center' });
    currentY += 5;
    
    
   

    const pdfDataUri = doc.output('datauristring');
    setPdfData(pdfDataUri);
  };

  // Función de padding
  // si alignRight es true, alinea a la derecha, de lo contrario a la izquierda
  const pad = (text, length, alignRight=false) => {
    const str = text.toString();
    if (str.length > length) {
      return str.substring(0,length);
    }
    if (alignRight) {
      return str.padStart(length, ' ');
    } else {
      return str.padEnd(length, ' ');
    }
  };

  // Mostramos el PDF dentro de un iframe
  return (
    <div style={{ width: '100%', height: '100%' }}>
      {pdfData && (
        <iframe
          title="recibo"
          src={pdfData}
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      )}
    </div>
  );
};

export default ThermalReceiptPDF;
