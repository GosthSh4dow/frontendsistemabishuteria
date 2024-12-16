import React, { useEffect, useState } from "react";
import { Layout, Table, Button, Select, message, Tabs } from "antd";
import { DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import axios from "axios";
import API_BASE_URL from "../config/api"; // Asegúrate de que este archivo sea correcto
import jsPDF from "jspdf";
import "jspdf-autotable"; // Esta librería ayuda con tablas en el PDF

const { Option } = Select;
const { Content } = Layout;
const { TabPane } = Tabs;

const Reportes = () => {
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroProductos, setFiltroProductos] = useState("todos"); // Filtro para productos: 'todos', 'porAgotar', 'agotados'

  // Obtener los reportes desde la API
  const fetchReportes = async () => {
    setLoading(true);
    try {
      // Obtener productos
      const productoData = await axios.get(`${API_BASE_URL}/productos`);
      setProductos(productoData.data);

      // Obtener ventas
      const ventaData = await axios.get(`${API_BASE_URL}/ventas`);
      setVentas(ventaData.data);

      // Obtener cajas
      const cajaData = await axios.get(`${API_BASE_URL}/cajas/all?id_sucursal=1`);
      setCajas(cajaData.data);
    } catch (error) {
      message.error("Error al cargar los reportes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportes();
  }, []);

  // Filtrar productos según el stock
  const filterProductos = (productos, filtro) => {
    switch (filtro) {
      case "porAgotar":
        return productos.filter((producto) => parseInt(producto.stock) <= 5);
      case "agotados":
        return productos.filter((producto) => parseInt(producto.stock) === 0);
      default:
        return productos;
    }
  };

  // Función para guardar los datos en PDF
  const guardarPDF = (data, title, columns) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.autoTable({
      startY: 30,
      head: [columns],
      body: data,
    });
    doc.save(`${title}.pdf`);
  };

  // Configuración de columnas de la tabla de productos
  const columnsProductos = [
    { title: "Nombre", dataIndex: "nombre", key: "nombre" },
    { title: "Descripción", dataIndex: "descripcion", key: "descripcion" },
    { title: "Stock", dataIndex: "stock", key: "stock" },
    { title: "Precio", dataIndex: "precio_venta", key: "precio_venta" },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteProducto(record.id)}
        >
          Eliminar
        </Button>
      ),
    },
  ];

  // Configuración de columnas de la tabla de ventas
  const columnsVentas = [
    { title: "Fecha", dataIndex: "fecha", key: "fecha" },
    { title: "Monto Total", dataIndex: "monto_total", key: "monto_total" },
    {
      title: "Cliente",
      dataIndex: "cliente",
      key: "cliente",
      render: (cliente) => cliente.nombre_completo,
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteVenta(record.id)}
        >
          Eliminar
        </Button>
      ),
    },
  ];

  // Configuración de columnas de la tabla de cajas
  const columnsCajas = [
    { title: "Fecha", dataIndex: "fecha", key: "fecha" },
    { title: "Saldo Inicial", dataIndex: "saldo_inicial", key: "saldo_inicial" },
    { title: "Ingresos", dataIndex: "ingresos", key: "ingresos" },
    { title: "Egresos", dataIndex: "egresos", key: "egresos" },
    { title: "Saldo Final", dataIndex: "saldo_final", key: "saldo_final" },
    { title: "Estado", dataIndex: "estado", key: "estado" },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteCaja(record.id)}
        >
          Eliminar
        </Button>
      ),
    },
  ];

  // Función para eliminar productos
  const handleDeleteProducto = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/productos/${id}`);
      message.success("Producto eliminado correctamente");
      fetchReportes(); // Recargar los datos después de eliminar
    } catch (error) {
      message.error("Error al eliminar el producto");
    }
  };

  // Funciones para eliminar ventas, cajas y sucursales
  const handleDeleteVenta = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/ventas/${id}`);
      message.success("Venta eliminada correctamente");
      fetchReportes();
    } catch (error) {
      message.error("Error al eliminar la venta");
    }
  };

  const handleDeleteCaja = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/cajas/${id}`);
      message.success("Caja eliminada correctamente");
      fetchReportes();
    } catch (error) {
      message.error("Error al eliminar la caja");
    }
  };

  return (
    <div>
      <Tabs defaultActiveKey="1" centered>
        <TabPane tab="Productos" key="1">
          <h3>Filtrar Productos</h3>
          <Select
            defaultValue="todos"
            style={{ width: 120 }}
            onChange={(value) => setFiltroProductos(value)}
          >
            <Option value="todos">Todos</Option>
            <Option value="porAgotar">Por Agotar</Option>
            <Option value="agotados">Agotados</Option>
          </Select>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() =>
              guardarPDF(
                filterProductos(productos, filtroProductos),
                `Reporte de Productos (${filtroProductos})`,
                ["Nombre", "Descripción", "Stock", "Precio"]
              )
            }
            style={{ marginLeft: 16 }}
          >
            Guardar PDF
          </Button>
          <Table
            columns={columnsProductos}
            dataSource={filterProductos(productos, filtroProductos)}
            rowKey="id"
            loading={loading}
            style={{ marginTop: 20 }}
            scroll={{ y: 240 }} // Esto agrega un scroll vertical y limita el número de filas visibles
          />
        </TabPane>

        <TabPane tab="Ventas" key="2">
          <h3>Reporte de Ventas</h3>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() =>
              guardarPDF(
                ventas,
                "Reporte de Ventas",
                ["Fecha", "Monto Total", "Cliente"]
              )
            }
            style={{ marginBottom: 20 }}
          >
            Guardar PDF
          </Button>
          <Table
            columns={columnsVentas}
            dataSource={ventas}
            rowKey="id"
            loading={loading}
            style={{ marginTop: 20 }}
            scroll={{ y: 240 }} // Agrega scroll a la tabla
          />
        </TabPane>

        <TabPane tab="Cajas" key="3">
          <h3>Reporte de Cajas</h3>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() =>
              guardarPDF(
                cajas,
                "Reporte de Cajas",
                ["Fecha", "Saldo Inicial", "Ingresos", "Egresos", "Saldo Final", "Estado"]
              )
            }
            style={{ marginBottom: 20 }}
          >
            Guardar PDF
          </Button>
          <Table
            columns={columnsCajas}
            dataSource={cajas}
            rowKey="id"
            loading={loading}
            style={{ marginTop: 20 }}
            scroll={{ y: 240 }} // Agrega scroll a la tabla
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Reportes;
