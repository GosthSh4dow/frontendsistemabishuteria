import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  Tag,
  Tooltip,
  message,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const { confirm } = Modal;

const Sucursales = () => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState(null); // Para editar una sucursal
  const [form] = Form.useForm();

  // Obtener sucursales desde el backend
  const fetchSucursales = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/sucursales`);
      setSucursales(response.data);
    } catch (error) {
      message.error('Error al cargar las sucursales');
    } finally {
      setLoading(false);
    }
  };

  // Manejar la apertura del modal
  const showModal = (sucursal = null) => {
    setEditingSucursal(sucursal);
    if (sucursal) {
      form.setFieldsValue(sucursal);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  // Manejar el cierre del modal
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingSucursal(null);
  };

  // Crear o editar sucursal
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      if (editingSucursal) {
        await axios.put(`${API_BASE_URL}/sucursales/${editingSucursal.id}`, values);
        message.success('Sucursal actualizada exitosamente');
      } else {
        await axios.post(`${API_BASE_URL}/sucursales`, values);
        message.success('Sucursal creada exitosamente');
      }
      fetchSucursales();
      handleCancel();
    } catch (error) {
      message.error('Error al guardar la sucursal');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar sucursal con confirmación
  const handleDelete = (id) => {
    confirm({
      title: '¿Estás seguro de eliminar esta sucursal?',
      icon: <ExclamationCircleOutlined />,
      content: 'Esta acción no se puede deshacer.',
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/sucursales/${id}`);
          message.success('Sucursal eliminada correctamente');
          fetchSucursales();
        } catch (error) {
          message.error('Error al eliminar la sucursal');
        }
      },
    });
  };

  // Configuración de columnas de la tabla
  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
    },
    {
      title: 'Dirección',
      dataIndex: 'direccion',
      key: 'direccion',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) =>
        estado === 'activa' ? (
          <Tag color="green">Activa</Tag>
        ) : (
          <Tag color="red">Inactiva</Tag>
        ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
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

  useEffect(() => {
    fetchSucursales();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <h2>Gestión de Sucursales</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
          style={{ backgroundColor: '#f500a2', borderColor: '#f500a2' }}
        >
          Nueva Sucursal
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={sucursales}
        rowKey={(record) => record.id}
        loading={loading}
      />

      {/* Modal para crear/editar sucursales */}
      <Modal
        title={editingSucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}
        visible={isModalVisible}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        okText={editingSucursal ? 'Actualizar' : 'Crear'}
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Nombre"
            name="nombre"
            rules={[{ required: true, message: 'Por favor ingrese el nombre de la sucursal' }]}
          >
            <Input placeholder="Nombre de la sucursal" />
          </Form.Item>
          <Form.Item
            label="Dirección"
            name="direccion"
            rules={[{ required: true, message: 'Por favor ingrese la dirección' }]}
          >
            <Input placeholder="Dirección de la sucursal" />
          </Form.Item>
          <Form.Item label="Estado" name="estado" valuePropName="checked">
            <Switch checkedChildren="Activa" unCheckedChildren="Inactiva" />
          </Form.Item>
          {/* Campo HWID */}
          <Form.Item
            label="HWID (Identificador Único)"
            name="hwid"
            rules={[{ required: true, message: 'Por favor ingrese el HWID' }]}
          >
            <Input placeholder="HWID de la PC" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Sucursales;
