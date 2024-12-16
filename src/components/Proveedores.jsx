import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Tooltip,
  message,
} from "antd";
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axios from "axios";
import API_BASE_URL from "../config/api";

const { confirm } = Modal;

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null); // Proveedor en edición
  const [form] = Form.useForm();

  // Obtener proveedores del backend
  const fetchProveedores = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/proveedores`);
      setProveedores(response.data);
    } catch (error) {
      message.error("Error al cargar los proveedores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  // Abrir modal para crear o editar proveedor
  const showModal = (proveedor = null) => {
    setEditingProveedor(proveedor);
    if (proveedor) {
      form.setFieldsValue(proveedor);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  // Cerrar modal
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingProveedor(null);
  };

  // Crear o editar proveedor
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      if (editingProveedor) {
        await axios.put(
          `${API_BASE_URL}/proveedores/${editingProveedor.id}`,
          values
        );
        message.success("Proveedor actualizado exitosamente");
      } else {
        await axios.post(`${API_BASE_URL}/proveedores`, values);
        message.success("Proveedor creado exitosamente");
      }
      fetchProveedores();
      handleCancel();
    } catch (error) {
      message.error("Error al guardar el proveedor");
    } finally {
      setLoading(false);
    }
  };

  // Confirmar eliminación de proveedor
  const handleDelete = (id) => {
    confirm({
      title: "¿Estás seguro de eliminar este proveedor?",
      icon: <ExclamationCircleOutlined />,
      content: "Esta acción no se puede deshacer.",
      okText: "Sí, eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/proveedores/${id}`);
          message.success("Proveedor eliminado correctamente");
          fetchProveedores();
        } catch (error) {
          message.error("Error al eliminar el proveedor");
        }
      },
    });
  };

  // Configuración de columnas de la tabla
  const columns = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
    },
    {
      title: "Contacto",
      dataIndex: "contacto",
      key: "contacto",
    },
    {
      title: "Correo Electrónico",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Editar">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
            />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
        <h2>Gestión de Proveedores</h2>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={() => showModal()}
          style={{ backgroundColor: "#f500a2", borderColor: "#f500a2" }}
        >
          Nuevo Proveedor
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={proveedores}
        rowKey={(record) => record.id}
        loading={loading}
      />

      {/* Modal para crear/editar proveedor */}
      <Modal
        title={editingProveedor ? "Editar Proveedor" : "Nuevo Proveedor"}
        visible={isModalVisible}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        okText={editingProveedor ? "Actualizar" : "Crear"}
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Nombre"
            name="nombre"
            rules={[{ required: true, message: "Por favor ingrese el nombre" }]}
          >
            <Input placeholder="Nombre del proveedor" />
          </Form.Item>
          <Form.Item
            label="Contacto"
            name="contacto"
            rules={[{ required: true, message: "Por favor ingrese un contacto" }]}
          >
            <Input placeholder="Número de teléfono o contacto" />
          </Form.Item>
          <Form.Item
            label="Correo Electrónico"
            name="email"
            rules={[
              { required: true, message: "Por favor ingrese el correo electrónico" },
              { type: "email", message: "Ingrese un correo válido" },
            ]}
          >
            <Input placeholder="Correo electrónico" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Proveedores;
