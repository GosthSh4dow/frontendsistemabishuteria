// src/components/Ventas.jsx

import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Input,
  Table,
  Modal,
  Form,
  Select,
  Typography,
  Row,
  Col,
  message,
  notification,
  Spin,
  Divider,
  Checkbox,
} from "antd";
import {
  BarcodeOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axios from "axios";
import API_BASE_URL from "../config/api";
import { useUser } from "../UserContext";
import ThermalReceiptPDF from "./ThermalReceiptPDF";

const { Title, Text } = Typography;
const { confirm } = Modal;

const Ventas = () => {
  const { user, branch, userId, branchId } = useUser();
  const id_usuario = userId;
  const id_sucursal = branchId;

  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [codigoBarras, setCodigoBarras] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumenVentaVisible, setResumenVentaVisible] = useState(false);
  const [formCliente] = Form.useForm();
  const [noReceipt, setNoReceipt] = useState(false);
  const [loadingCliente, setLoadingCliente] = useState(false);
  const barcodeInputRef = useRef(null);
  const ciInputRef = useRef(null);

  const [ventaData, setVentaData] = useState(null);
  const [detallesVenta, setDetallesVenta] = useState([]);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [pdfVisible, setPdfVisible] = useState(false);
  const receiptRef = useRef();
  const [saving, setSaving] = useState(false);

  const calcularPrecioFinal = (producto) => {
    let precioFinal = parseFloat(producto.precio_venta);
    if (producto.promociones && producto.promociones.length > 0) {
      const ahora = new Date();
      const promocionesActivas = producto.promociones.filter((promo) => {
        const fechaInicio = new Date(promo.fecha_inicio);
        const fechaFin = new Date(promo.fecha_fin);
        return ahora >= fechaInicio && ahora <= fechaFin;
      });

      if (promocionesActivas.length > 0) {
        const promo = promocionesActivas[0];
        if (promo.tipo === "descuento") {
          precioFinal -= (precioFinal * parseFloat(promo.valor)) / 100;
        }
      }
    }
    return precioFinal;
  };

  const tiene2x1 = (producto) => {
    if (producto.promociones && producto.promociones.length > 0) {
      const ahora = new Date();
      return producto.promociones.some((promo) => {
        const fechaInicio = new Date(promo.fecha_inicio);
        const fechaFin = new Date(promo.fecha_fin);
        return promo.tipo === "2x1" && ahora >= fechaInicio && ahora <= fechaFin;
      });
    }
    return false;
  };

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/productos`);
      const productosActualizados = response.data.map((prod) => ({
        ...prod,
        precio_venta: parseFloat(prod.precio_venta),
        costo: parseFloat(prod.costo),
      }));
      setProductos(productosActualizados);
    } catch (error) {
      message.error("Error al cargar los productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const buscarProducto = async (codigo) => {
    const codigoUpper = codigo.toUpperCase(); // Convertir a mayúsculas
    const producto = productos.find((prod) => prod.codigo_barras === codigoUpper);
    if (producto) {
      const carritoActualizado = [...carrito];
      const productoExistente = carritoActualizado.find((item) => item.id === producto.id);

      let cantidadIncremento = 1;
      if (tiene2x1(producto)) {
        cantidadIncremento = 2;
      }

      if (productoExistente) {
        productoExistente.cantidad += cantidadIncremento;
      } else {
        carritoActualizado.push({ ...producto, cantidad: cantidadIncremento });
      }

      setCarrito(carritoActualizado);
      setCodigoBarras("");
      barcodeInputRef.current.focus();

      notification.success({
        message: "Producto agregado al carrito",
        description: `${producto.nombre} ha sido agregado.`,
      });
    } else {
     // message.error("Producto no encontrado.");
    }
  };

  const eliminarProductoDelCarrito = (productoId) => {
    const nuevoCarrito = carrito.filter((prod) => prod.id !== productoId);
    setCarrito(nuevoCarrito);
  };

  const calcularTotal = () => {
    return carrito.reduce((total, producto) => {
      const precioFinal = calcularPrecioFinal(producto);
      const qty = producto.cantidad || 0;
      const totalProducto = tiene2x1(producto)
        ? precioFinal * Math.ceil(qty / 2)
        : precioFinal * qty;
      return total + totalProducto;
    }, 0);
  };

  const handleBarcodeChange = (e) => {
    const codigo = e.target.value.toUpperCase(); // Convertir a mayúsculas
    setCodigoBarras(codigo);
    if (codigo.length >= 2) {
      buscarProducto(codigo);
    }
  };

  const handleNoReceiptChange = (e) => {
    setNoReceipt(e.target.checked);
    if (e.target.checked) {
      formCliente.resetFields();
      setCliente(null);
      formCliente.setFieldsValue({ ci: "0", nombre_completo: "" });
      notification.info({
        message: "Sin Datos de Recibo",
        description: "La venta se registrará sin asociar datos del cliente.",
      });
    } else {
      setCodigoBarras("");
      barcodeInputRef.current.focus();
      formCliente.setFieldsValue({ ci: "", nombre_completo: "" });
    }
  };

  const handleBuscarCliente = async () => {
    if (noReceipt) return;
    const ci = formCliente.getFieldValue("ci");
    if (!ci || ci === "0") {
      message.warning("Por favor, ingresa un CI válido del cliente.");
      return;
    }
    setLoadingCliente(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/clientes?ci=${ci}`);
      if (response.data && Object.keys(response.data).length > 0) {
        setCliente(response.data);
        formCliente.setFieldsValue({
          nombre_completo: response.data.nombre_completo,
        });
        notification.success({
          message: "Cliente encontrado",
          description: `${response.data.nombre_completo} ha sido encontrado.`,
        });
      } else {
        setCliente(null);
        formCliente.resetFields(["nombre_completo"]);
        notification.info({
          message: "Cliente no encontrado",
          description: "Por favor, ingresa los datos del cliente manualmente.",
        });
      }
    } catch (error) {
      message.error("EL cliente no existe");
    } finally {
      setLoadingCliente(false);
    }
  };

  const handleFinalizarVenta = () => {
    setResumenVentaVisible(true);
  };

  const confirmarVenta = async () => {
    setSaving(true);
    let ventaDataTemp = {
      id_cliente: noReceipt ? 0 : cliente?.id_cliente,
      id_usuario,
      id_sucursal,
      detalles: carrito.map((item) => {
        const precioFinal = calcularPrecioFinal(item);
        const qty = item.cantidad || 0;
        const subtotal = tiene2x1(item)
          ? precioFinal * Math.ceil(qty / 2)
          : precioFinal * qty;

        return {
          producto_id: item.id,
          cantidad: qty,
          precio_unitario: Number(precioFinal),
          subtotal: Number(subtotal),
        };
      }),
      monto_total: calcularTotal(),
      fecha: new Date().toISOString(),
      vendedor: user?.nombre_completo || "Vendedor",
    };

    try {
      if (!noReceipt && !cliente) {
        const clienteValues = formCliente.getFieldsValue();
        const { nombre_completo, ci } = clienteValues;

        if (!nombre_completo || !ci || ci === "0") {
          message.error("Por favor completa todos los campos del cliente");
          setSaving(false);
          return;
        }

        const response = await axios.post(`${API_BASE_URL}/clientes`, {
          nombre_completo,
          ci: ci.toUpperCase(), // Convertir a mayúsculas
        });
        ventaDataTemp.id_cliente = response.data.id_cliente;
      }

      const responseVenta = await axios.post(`${API_BASE_URL}/ventas`, ventaDataTemp);
      message.success("Venta registrada exitosamente");

      setCliente(responseVenta.data.cliente || null);

      // Agregar las siguientes líneas:
      if (!noReceipt && !responseVenta.data.cliente) {
        // Si no hay cliente devuelto por el backend, usar el ingresado en el formulario
        setCliente({
          nombre_completo: formCliente.getFieldValue('nombre_completo') || 'Sin Nombre',
          ci: formCliente.getFieldValue('ci') || '0'
        });
      }
      setVentaData({
        fecha: responseVenta.data.fecha,
        vendedor: responseVenta.data.vendedor,
        monto_total: responseVenta.data.monto_total,
        sucursal_direccion: responseVenta.data.sucursal.direccion || "",
        sucursal_nombre: responseVenta.data.sucursal.nombre || "",
      });

      setDetallesVenta(responseVenta.data.detalles || []);
      setResumenVentaVisible(false);
      setPdfVisible(true);

      setCarrito([]);
      setCliente(null);
      setNoReceipt(false);
      formCliente.resetFields();
      barcodeInputRef.current.focus();
    } catch (error) {
      if (error.response && error.response.data) {
        if (error.response.data.error === "El CI ya está registrado.") {
          try {
            const existingClienteResponse = await axios.get(
              `${API_BASE_URL}/clientes?ci=${formCliente.getFieldValue("ci").toUpperCase()}`
            );
            if (existingClienteResponse.data && Object.keys(existingClienteResponse.data).length > 0) {
              ventaDataTemp.id_cliente = existingClienteResponse.data.id_cliente;
              const responseVenta = await axios.post(`${API_BASE_URL}/ventas`, ventaDataTemp);
              message.success("Venta registrada exitosamente con el cliente existente");

              setCliente(responseVenta.data.cliente || null);
              if (!noReceipt && !responseVenta.data.cliente) {
                setCliente({
                  nombre_completo: formCliente.getFieldValue('nombre_completo') || 'Sin Nombre',
                  ci: formCliente.getFieldValue('ci') || '0'
                });
              }
              setVentaData({
                fecha: responseVenta.data.fecha,
                vendedor: responseVenta.data.vendedor,
                monto_total: responseVenta.data.monto_total,
                sucursal_direccion: responseVenta.data.sucursal.direccion || "",
                sucursal_nombre: responseVenta.data.sucursal.nombre || "",
              });

              setDetallesVenta(responseVenta.data.detalles || []);
              setResumenVentaVisible(false);
              setPdfVisible(true);

              setCarrito([]);
              setCliente(null);
              setNoReceipt(false);
              formCliente.resetFields();
              barcodeInputRef.current.focus();
            } else {
              message.error("Error al asociar el cliente existente.");
            }
          } catch (searchError) {
            message.error("Error al buscar el cliente existente.");
          }
        } else {
          message.error("Error al registrar la venta");
          console.error("Error al registrar la venta:", error);
          if (error.response.data.detalle) {
            message.error(`Detalle del error: ${error.response.data.detalle}`);
          }
        }
      } else {
        message.error("Error al registrar la venta");
        console.error("Error al registrar la venta:", error);
      }
    } finally {
      setSaving(false);
    }
  };

  const cancelarVenta = () => {
    confirm({
      title: "¿Estás seguro de cancelar la venta?",
      icon: <ExclamationCircleOutlined />,
      content: "Toda la información de la venta actual se perderá.",
      okText: "Sí",
      okType: "danger",
      cancelText: "No",
      onOk() {
        setResumenVentaVisible(false);
        setCarrito([]);
        setCliente(null);
        setNoReceipt(false);
        formCliente.resetFields();
        message.info("Venta cancelada.");
        barcodeInputRef.current.focus();
      },
      onCancel() {},
    });
  };

  const renderPrecioConDescuento = (precio, record) => {
    if (precio === undefined || precio === null) return "Bs. 0.00";
    const precioFinal = calcularPrecioFinal(record);
    const descuentoActivo = precioFinal < precio;
    const es2x1 = tiene2x1(record);

    let texto = "";
    if (descuentoActivo) {
      texto = (
        <>
          <Text delete style={{ color: "red" }}>
            Bs. {precio.toFixed(2)}
          </Text>
          <br />
          <Text strong>Bs. {precioFinal.toFixed(2)}</Text>
          {es2x1 && <Text type="secondary" style={{ marginLeft: "5px" }}>(2x1)</Text>}
        </>
      );
    } else {
      texto = (
        <>
          <Text>Bs. {precio.toFixed(2)}</Text>
          {es2x1 && <Text type="secondary" style={{ marginLeft: "5px" }}>(2x1)</Text>}
        </>
      );
    }

    return texto;
  };

  const renderTotal = (record) => {
    if (!record.precio_venta || !record.cantidad) return "Bs. 0.00";
    const precioFinal = calcularPrecioFinal(record);
    const qty = record.cantidad || 0;
    const es2x1 = tiene2x1(record);

    const total = es2x1
      ? precioFinal * Math.ceil(qty / 2)
      : precioFinal * qty;

    return `Bs. ${total.toFixed(2)}`;
  };

  const columnsCarrito = [
    {
      title: "Producto",
      dataIndex: "nombre",
      key: "nombre",
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      render: (stock) => `${stock} unidades disponibles`,
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad",
      key: "cantidad",
      render: (cantidad, record) => (
        <Select
          value={cantidad}
          onChange={(value) => {
            const nuevoCarrito = carrito.map((item) =>
              item.id === record.id ? { ...item, cantidad: value } : item
            );
            setCarrito(nuevoCarrito);
          }}
        >
          {[...Array(record.stock).keys()].map((i) => (
            <Select.Option key={i + 1} value={i + 1}>
              {i + 1}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Precio",
      dataIndex: "precio_venta",
      key: "precio_venta",
      render: (precio, record) => renderPrecioConDescuento(precio, record),
    },
    {
      title: "Total",
      key: "total",
      render: (text, record) => renderTotal(record),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => eliminarProductoDelCarrito(record.id)}
        />
      ),
    },
  ];

  const columnsResumenVenta = [
    { title: "Producto", dataIndex: "nombre", key: "nombre" },
    { title: "Cantidad", dataIndex: "cantidad", key: "cantidad" },
    {
      title: "Precio Unitario",
      dataIndex: "precio_venta",
      key: "precio_venta",
      render: (precio, record) => {
        return renderPrecioConDescuento(precio, record);
      },
    },
    { title: "Total", key: "total", render: (text, record) => renderTotal(record) },
  ];

  const handleClosePdf = () => {
    setPdfVisible(false);
    setVentaData(null);
    setDetallesVenta([]);
    setCliente(null);
  };

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Ventas</Title>

      <Row gutter={16} style={{ marginBottom: "20px" }}>
        <Col span={8}>
          <Input
            placeholder="Escanear Código de Barras"
            prefix={<BarcodeOutlined />}
            value={codigoBarras}
            onChange={handleBarcodeChange}
            allowClear
            ref={barcodeInputRef} // Asignar la referencia
            style={{ width: "100%" }}
          />
        </Col>
        <Col span={16} style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            size="large"
            disabled={carrito.length === 0}
            onClick={handleFinalizarVenta}
          >
            Finalizar Venta
          </Button>
        </Col>
      </Row>

      <Spin spinning={loading}>
        <Table
          columns={columnsCarrito}
          dataSource={carrito}
          rowKey="id"
          pagination={false}
          style={{ marginBottom: "20px" }}
        />
      </Spin>

      <Row gutter={16}>
        <Col span={12}>
          <Text strong>Total:</Text>
        </Col>
        <Col span={12} style={{ textAlign: "right" }}>
          <Text type="danger" strong>
            Bs. {calcularTotal().toFixed(2)}
          </Text>
        </Col>
      </Row>

      <Modal
        title="Resumen de la Venta"
        visible={resumenVentaVisible}
        onCancel={() => {
          if (!saving) cancelarVenta();
        }}
        footer={[
          <Button key="cancel" onClick={cancelarVenta} disabled={saving}>
            Cancelar
          </Button>,
          <Button key="confirm" type="primary" onClick={confirmarVenta} loading={saving}>
            {saving ? "Guardando..." : "Confirmar Venta"}
          </Button>,
        ]}
        width={800}
        destroyOnClose
      >
        <Divider />
        <Title level={4}>Datos del Cliente</Title>
        <Checkbox
          checked={noReceipt}
          onChange={handleNoReceiptChange}
          style={{ marginBottom: "10px" }}
        >
          Sin datos de recibo
        </Checkbox>
        {!noReceipt && (
          <Form
            form={formCliente}
            layout="vertical"
            style={{ marginBottom: "20px" }}
          >
            <Row gutter={16} align="middle">
              <Col span={12}>
                <Form.Item
                  label="Cédula de Identidad (CI)"
                  name="ci"
                  rules={[
                    { required: !noReceipt, message: "Por favor ingrese el CI del cliente" },
                    {
                      pattern: /^\d+$/,
                      message: "El CI debe contener solo números",
                    },
                  ]}
                >
                  <Input
                    placeholder="Ingrese CI del cliente"
                    ref={ciInputRef}
                    suffix={
                      <SearchOutlined
                        onClick={handleBuscarCliente}
                        style={{ cursor: "pointer" }}
                      />
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Nombre Completo"
                  name="nombre_completo"
                  rules={[
                    { required: !noReceipt, message: "Por favor ingrese el nombre del cliente" },
                  ]}
                >
                  <Input disabled={noReceipt} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
        <Divider />

        <Title level={4}>Resumen de Compras</Title>
        <Table
          columns={columnsResumenVenta}
          dataSource={carrito}
          rowKey="id"
          pagination={false}
          size="small"
          style={{ marginBottom: "20px" }}
        />

        <Divider />

        <Row>
          <Col span={12}>
            <Text strong>Total a Pagar:</Text>
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
            <Text type="danger" strong>
              Bs. {calcularTotal().toFixed(2)}
            </Text>
          </Col>
        </Row>
      </Modal>

      <Modal
        title="Recibo de Venta"
        visible={pdfVisible}
        onCancel={handleClosePdf}
        footer={[
          <Button key="close" onClick={handleClosePdf}>
            Cerrar
          </Button>,
        ]}
        width={450}
        bodyStyle={{ height: '300px' }}
        destroyOnClose
      >
        {ventaData && (
          <ThermalReceiptPDF
            venta={ventaData}
            detallesVenta={detallesVenta}
            cliente={cliente}
            noReceipt={noReceipt}
          />
        )}
      </Modal>
    </div>
  );
};

export default Ventas;
