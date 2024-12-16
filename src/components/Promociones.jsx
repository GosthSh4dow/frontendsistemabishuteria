import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Tabs,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment"; // Importamos moment
import API_BASE_URL from "../config/api";

const { Title } = Typography;
const { TabPane } = Tabs;

const Promociones = () => {
  const [promociones, setPromociones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [selectedProductos, setSelectedProductos] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingPromocion, setEditingPromocion] = useState(null);
  const [form] = Form.useForm();

  // Fetch promociones y productos
  const fetchPromociones = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/promociones`);
      setPromociones(response.data);
    } catch (error) {
      message.error("Error al cargar las promociones");
    }
  };

  const fetchProductos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/productos`);
      setProductos(response.data);
    } catch (error) {
      message.error("Error al cargar los productos");
    }
  };

  useEffect(() => {
    fetchPromociones();
    fetchProductos();
  }, []);

  // Mostrar modal para crear/editar promoción
  const showModal = (promocion = null) => {
    setEditingPromocion(promocion);
    if (promocion) {
      form.setFieldsValue({
        ...promocion,
        id_productos: promocion.productos.map((p) => p.id),
        rangoFechas: [
          moment(promocion.fecha_inicio), // Usamos moment aquí
          moment(promocion.fecha_fin),
        ],
      });
      setSelectedProductos(promocion.productos.map((p) => p.id));
    } else {
      form.resetFields();
      setSelectedProductos([]);
    }
    setIsModalVisible(true);
  };

  // Cerrar modal principal
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingPromocion(null);
  };

  // Guardar promoción
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const { rangoFechas, ...rest } = values;

      const payload = {
        ...rest,
        id_productos: selectedProductos,
        fecha_inicio: rangoFechas[0].format("YYYY-MM-DD"),
        fecha_fin: rangoFechas[1].format("YYYY-MM-DD"),
      };

      if (selectedProductos.length === 0) {
        message.error("Debe seleccionar al menos un producto.");
        setLoading(false);
        return;
      }

      if (editingPromocion) {
        await axios.put(
          `${API_BASE_URL}/promociones/${editingPromocion.id}`,
          payload
        );
        message.success("Promoción actualizada exitosamente.");
      } else {
        await axios.post(`${API_BASE_URL}/promociones`, payload);
        message.success("Promoción creada exitosamente.");
      }
      fetchPromociones();
      fetchProductos();
      handleCancel();
    } catch (error) {
      message.error("Error al guardar la promoción.");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar promoción
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/promociones/${id}`);
      message.success("Promoción eliminada correctamente");
      fetchPromociones();
      fetchProductos();
    } catch (error) {
      message.error("Error al eliminar la promoción");
    }
  };

  // Quitar promoción de un producto
  const handleRemovePromotion = async (productoId, promocionId) => {
    try {
      await axios.delete(`${API_BASE_URL}/promociones/${promocionId}/producto/${productoId}`);
      message.success("Promoción eliminada del producto.");
      fetchProductos();
    } catch (error) {
      message.error("Error al quitar la promoción del producto.");
    }
  };

  // Alternar selección de productos
  const toggleProducto = (id) => {
    setSelectedProductos((prev) =>
      prev.includes(id) ? prev.filter((prodId) => prodId !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <Tabs defaultActiveKey="1">
        {/* Tab: Gestión de Promociones */}
        <TabPane tab="Gestión de Promociones" key="1">
          <div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              Nueva Promoción
            </Button>
            <Table
              columns={[
                { title: "Tipo", dataIndex: "tipo" },
                { title: "Descripción", dataIndex: "descripcion" },
                { title: "Valor", dataIndex: "valor", render: (valor) => `${valor}%` },
                {
                  title: "Fecha Inicio",
                  dataIndex: "fecha_inicio",
                  render: (fecha) => moment(fecha).format("YYYY-MM-DD"),
                },
                {
                  title: "Fecha Fin",
                  dataIndex: "fecha_fin",
                  render: (fecha) => moment(fecha).format("YYYY-MM-DD"),
                },
                {
                  title: "Acciones",
                  render: (_, record) => (
                    <Space>
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => showModal(record)}
                      />
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                      />
                    </Space>
                  ),
                },
              ]}
              dataSource={promociones}
              rowKey="id"
            />
          </div>
        </TabPane>

        {/* Tab: Productos en Promoción */}
        <TabPane tab="Productos en Promoción" key="2">
          <Table
            columns={[
              { title: "Nombre", dataIndex: "nombre" },
              {
                title: "Promoción Activa",
                dataIndex: "promociones",
                render: (promociones) =>
                  promociones.length
                    ? promociones.map((promo) => (
                        <Tag key={promo.id}>
                          <Space>
                            {promo.tipo} ({promo.valor}%)
                            <Tooltip title="Eliminar promoción de este producto">
                              <CloseCircleOutlined
                                style={{ marginLeft: 8 }}
                                onClick={() => handleRemovePromotion(promo.producto_id, promo.id)}
                              />
                            </Tooltip>
                          </Space>
                        </Tag>
                      ))
                    : "Sin Promoción",
              },
              {
                title: "Acciones",
                render: (_, record) =>
                  record.promociones.map((promo) => (
                    <Button
                      key={promo.id}
                      danger
                      onClick={() => handleRemovePromotion(record.id, promo.id)}
                    >
                      Quitar Promoción
                    </Button>
                  )),
              },
            ]}dataSource={productos.filter((producto) => producto.promociones.length > 0)} 
            rowKey="id"
          />
        </TabPane>
      </Tabs>

      {/* Modal para Crear/Editar Promoción */}
      <Modal
        title={editingPromocion ? "Editar Promoción" : "Nueva Promoción"}
        visible={isModalVisible}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        okText={editingPromocion ? "Actualizar" : "Crear"}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tipo de Promoción"
                name="tipo"
                rules={[{ required: true, message: "Seleccione el tipo" }]}
              >
                <Select
                  onChange={(value) => {
                    if (value === "2x1") {
                      form.setFieldsValue({ valor: 0 });
                    }
                  }}
                >
                  <Select.Option value="descuento">Descuento</Select.Option>
                  <Select.Option value="2x1">2x1</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                label="Descripción"
                name="descripcion"
                rules={[{ required: true, message: "Ingrese una descripción" }]}
              >
                <Input.TextArea />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item            label="Valor (si aplica)"
            name="valor"
            rules={[{ required: true, message: "Ingrese el valor" }]}
          >
            <Input
              type="number"
              disabled={form.getFieldValue("tipo") === "2x1"}
            />
          </Form.Item>
          <Form.Item label="Productos Asociados">
            <Button
              type="primary"
              onClick={() => setIsProductModalVisible(true)}
            >
              Seleccionar Productos
            </Button>
          </Form.Item>
          <Form.Item
            label="Fechas"
            name="rangoFechas"
            rules={[{ required: true, message: "Seleccione las fechas" }]}
          >
            <DatePicker.RangePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item label="Productos Seleccionados">
            {selectedProductos.length > 0 ? (
              selectedProductos.map((prodId) => {
                const product = productos.find((p) => p.id === prodId);
                return (
                  <Tag key={prodId} color="blue">
                    {product?.nombre || "Producto desconocido"}
                  </Tag>
                );
              })
            ) : (
              <span style={{ color: "red" }}>No se han seleccionado productos</span>
            )}
          </Form.Item>
        </Col>
      </Row>
    </Form>
  </Modal>

  {/* Modal para Seleccionar Productos */}
  <Modal
    title="Seleccionar Productos"
    visible={isProductModalVisible}
    onCancel={() => setIsProductModalVisible(false)}
    onOk={() => setIsProductModalVisible(false)}
    width={800}
  >
    <Table
      columns={[
        { title: "Nombre", dataIndex: "nombre" },
        { title: "Costo", dataIndex: "costo", render: (costo) => `Bs ${costo}` },
        {
          title: "Seleccionar",
          render: (_, record) => (
            <Button
              type="primary"
              size="small"
              icon={selectedProductos.includes(record.id) ? (
                <CheckOutlined />
              ) : (
                <PlusOutlined />
              )}
              onClick={() => toggleProducto(record.id)}
            >
              {selectedProductos.includes(record.id) ? "Seleccionado" : "Agregar"}
            </Button>
          ),
        },
      ]}
      dataSource={productos}
      rowKey="id"
      pagination={{ pageSize: 5 }}
    />
  </Modal>
</div>
); };

export default Promociones;
