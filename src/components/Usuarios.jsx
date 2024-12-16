import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tag,
  Space,
  Tooltip,
  message,
  TimePicker,
  Row,
  Col
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
import moment from "moment";

const { confirm } = Modal;
const { Option } = Select;

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [form] = Form.useForm();

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/usuarios`);
      setUsuarios(response.data);
    } catch (error) {
      message.error("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const fetchSucursales = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sucursales`);
      setSucursales(response.data);
    } catch (error) {
      message.error("Error al cargar las sucursales");
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchSucursales();
  }, []);

  const showModal = (usuario = null) => {
    setEditingUsuario(usuario);
    if (usuario) {
      form.setFieldsValue({
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        id_sucursal: usuario.id_sucursal,
        estado: usuario.estado,
        hora_entrada: moment(usuario.hora_entrada, "HH:mm:ss"),
        hora_salida: moment(usuario.hora_salida, "HH:mm:ss"),
        turno: usuario.turno,
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingUsuario(null);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        ...values,
        hora_entrada: values.hora_entrada.format("HH:mm:ss"),
        hora_salida: values.hora_salida.format("HH:mm:ss"),
      };

      if (editingUsuario) {
        if (!payload.password) {
          delete payload.password;
        }
        await axios.put(`${API_BASE_URL}/usuarios/${editingUsuario.id}`, payload);
        message.success("Usuario actualizado exitosamente");
      } else {
        if (!payload.estado) {
          payload.estado = 'activado';
        }
        await axios.post(`${API_BASE_URL}/usuarios`, payload);
        message.success("Usuario creado exitosamente");
      }
      fetchUsuarios();
      handleCancel();
    } catch (error) {
      console.error(error);
      message.error("Error al guardar el usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    confirm({
      title: "¿Estás seguro de eliminar este usuario?",
      icon: <ExclamationCircleOutlined />,
      content: "Esta acción no se puede deshacer.",
      okText: "Sí, eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/usuarios/${id}`);
          message.success("Usuario eliminado correctamente");
          fetchUsuarios();
        } catch (error) {
          message.error("Error al eliminar el usuario");
        }
      },
    });
  };

  const handleChangeEstado = (usuario, nuevoEstado) => {
    confirm({
      title: `¿Estás seguro de ${nuevoEstado === "activado" ? "activar" : "inactivar"} al usuario "${usuario.nombre}"?`,
      icon: <ExclamationCircleOutlined />,
      content: `Esta acción ${nuevoEstado === "activado" ? "activará" : "inactivará"} al usuario en el sistema.`,
      okText: nuevoEstado === "activado" ? "Sí, activar" : "Sí, inactivar",
      okType: nuevoEstado === "activado" ? "primary" : "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await axios.put(`${API_BASE_URL}/usuarios/${usuario.id}`, {
            estado: nuevoEstado,
          });
          message.success(`Usuario ${nuevoEstado === "activado" ? "activado" : "inactivado"} exitosamente`);
          fetchUsuarios();
        } catch (error) {
          message.error("Error al cambiar el estado del usuario");
        }
      },
    });
  };

  const columns = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
    },
    {
      title: "Correo Electrónico",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Rol",
      dataIndex: "rol",
      key: "rol",
      render: (rol) => (
        <Tag color={rol === "administrador" ? "red" : "blue"}>{rol.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Sucursal",
      dataIndex: "sucursal",
      key: "sucursal",
      render: (sucursal) => sucursal?.nombre || "Sin asignar",
    },
    {
      title: "Hora Entrada",
      dataIndex: "hora_entrada",
      key: "hora_entrada",
    },
    {
      title: "Hora Salida",
      dataIndex: "hora_salida",
      key: "hora_salida",
    },
    {
      title: "Turno",
      dataIndex: "turno",
      key: "turno",
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (estado, record) => (
        <Switch
          checked={estado === "activado"}
          onChange={(checked) => {
            const nuevoEstado = checked ? "activado" : "inactivo";
            handleChangeEstado(record, nuevoEstado);
          }}
          checkedChildren="Activado"
          unCheckedChildren="Inactivo"
        />
      ),
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
    <div style={{ padding: "16px" }}>
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Gestión de Usuarios</h2>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={() => showModal()}
          style={{ backgroundColor: "#f500a2", borderColor: "#f500a2" }}
        >
          Nuevo Usuario
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={usuarios}
        rowKey={(record) => record.id}
        loading={loading}
        style={{ marginBottom: "16px" }}
      />

      <Modal
        title={editingUsuario ? "Editar Usuario" : "Nuevo Usuario"}
        visible={modalVisible}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        okText={editingUsuario ? "Actualizar" : "Crear"}
        cancelText="Cancelar"
        confirmLoading={loading} 
        width={1000} 
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Nombre"
                name="nombre"
                rules={[{ required: true, message: "Por favor ingrese el nombre" }]}
              >
                <Input prefix={<UserAddOutlined />} placeholder="Nombre del usuario" />
              </Form.Item>
              <Form.Item
                label="Correo Electrónico"
                name="email"
                rules={[
                  { required: true, message: "Por favor ingrese el correo electrónico" },
                  { type: "email", message: "Ingrese un correo válido" },
                ]}
              >
                <Input prefix={<SearchOutlined />} placeholder="Correo electrónico" />
              </Form.Item>
              {!editingUsuario && (
                <Form.Item
                  label="Contraseña"
                  name="password"
                  rules={[{ required: true, message: "Por favor ingrese una contraseña" }]}
                >
                  <Input.Password prefix={<SearchOutlined />} placeholder="Contraseña" />
                </Form.Item>
              )}
              {editingUsuario && (
                <Form.Item
                  label="Contraseña"
                  name="password"
                  rules={[{ min: 6, message: "La contraseña debe tener al menos 6 caracteres" }]}
                  tooltip="Dejar en blanco si no desea cambiar la contraseña"
                >
                  <Input.Password prefix={<SearchOutlined />} placeholder="Nueva contraseña (opcional)" />
                </Form.Item>
              )}
            </Col>
            <Col span={8}>
              <Form.Item
                label="Rol"
                name="rol"
                rules={[{ required: true, message: "Por favor seleccione un rol" }]}
              >
                <Select placeholder="Seleccione un rol">
                  <Option value="usuario">Usuario</Option>
                  <Option value="administrador">Administrador</Option>
                </Select>
              </Form.Item>
              <Form.Item
                label="Sucursal"
                name="id_sucursal"
                rules={[{ required: true, message: "Por favor seleccione una sucursal" }]}
              >
                <Select placeholder="Seleccione una sucursal">
                  {sucursales.map((sucursal) => (
                    <Option key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              {editingUsuario && (
                <Form.Item
                  label="Estado"
                  name="estado"
                  rules={[{ required: true, message: "Por favor seleccione el estado del usuario" }]}
                >
                  <Select>
                    <Option value="activado">Activado</Option>
                    <Option value="inactivo">Inactivo</Option>
                  </Select>
                </Form.Item>
              )}
            </Col>
            <Col span={8}>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item
                    label="Hora de Entrada"
                    name="hora_entrada"
                    rules={[{ required: true, message: "Por favor seleccione la hora de entrada" }]}
                  >
                    <TimePicker format="HH:mm:ss" placeholder="Entrada" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Hora de Salida"
                    name="hora_salida"
                    rules={[{ required: true, message: "Por favor seleccione la hora de salida" }]}
                  >
                    <TimePicker format="HH:mm:ss" placeholder="Salida" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                label="Turno"
                name="turno"
                rules={[{ required: true, message: "Por favor seleccione el turno" }]}
              >
                <Select placeholder="Seleccione el turno">
                  <Option value="Mañana">Mañana</Option>
                  <Option value="Tarde">Tarde</Option>
                  <Option value="Noche">Noche</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Usuarios;
