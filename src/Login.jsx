// src/Login.jsx
import React, { useState, useEffect } from "react";
import { Form, Input, Button, Typography, Card, message, Modal, List, Tag } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { Fade } from "react-awesome-reveal";
import axios from "axios";
import API_BASE_URL from "./config/api";
import { useUser } from './UserContext'; // Asegúrate de la ruta correcta
import logo from './assets/images/logo.jpeg'; // Importa tu logotipo

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedReplacement, setSelectedReplacement] = useState(null);
  const navigate = useNavigate();
  const { setUserData, userData } = useUser();  // Acceder al contexto para actualizar los datos del usuario

  useEffect(() => {
    // Obtener la lista de usuarios para el reemplazo de turno (esto puede ir en tu API)
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/usuarios`);
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
        message.error("No se pudieron cargar los usuarios.");
      }
    };

    fetchUsers();
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      console.log(values);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: values.email,
        password: values.password,
      });

      const { token, usuario } = response.data;

      // Almacenar el token JWT en el localStorage
      localStorage.setItem("authToken", token);

      // Actualizar el contexto con los datos del usuario
      setUserData(usuario);

      message.success("Inicio de sesión exitoso");

      // Registrar el ingreso de la asistencia (con reemplazo si corresponde)
      await registrarIngreso(usuario);

      // Redirigir al Dashboard o página deseada
      navigate("/dashboard");
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data.error || "Credenciales incorrectas";
        message.error(errorMessage);
      } else {
        message.error("Error al conectar con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para registrar el ingreso de la asistencia (con reemplazo)
  const registrarIngreso = async (usuario) => {
    const fechaHoraActual = new Date().toISOString(); // Hora actual en formato ISO

    const data = {
      id_usuario: usuario.id,
      ingreso: fechaHoraActual,
      reemplazo_id: selectedReplacement ? selectedReplacement.id : null, // Si hay reemplazo, se envía el id de reemplazo
    };

    try {
      await axios.post(`${API_BASE_URL}/asistencias/crear`, data);
    } catch (error) {
      console.error("Error al registrar el ingreso:", error);
    }
  };

  // Abrir el modal para seleccionar el reemplazo de turno
  const showReplaceModal = () => {
    setIsModalVisible(true);
  };

  // Cerrar el modal
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // Manejar la selección del reemplazo
  const handleReplace = (user) => {
    setSelectedReplacement(user);
    setIsModalVisible(false);  // Cerrar el modal después de seleccionar
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f9f9f9",
        padding: "20px",
      }}
    >
      <Fade duration={500} triggerOnce>
        <Card
          style={{
            maxWidth: 400,
            width: "100%",
            textAlign: "center",
            borderRadius: 10,
            boxShadow: "0 4px 30px rgba(245, 0, 162, 0.6)",
          }}
        >
          {/* Agregar el logotipo aquí */}
          <div style={{ marginBottom: 24 }}>
            <img src={logo} alt="Logotipo" style={{ width: '120px', margin: '0 auto' }} />
          </div>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Title level={3} style={{ color: "#f500a2", fontWeight: 600 }}>
              Iniciar Sesión
            </Title>
            <Text type="secondary">Bienvenido de nuevo, ingrese sus credenciales</Text>
          </div>
          <Form
            name="login"
            layout="vertical"
            onFinish={onFinish}
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            <Form.Item
              label="Correo electrónico"
              name="email"
              rules={[{ required: true, message: "Por favor ingrese su correo electrónico" }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#f500a2" }} />}
                placeholder="Ingrese su correo electrónico"
              />
            </Form.Item>

            <Form.Item
              label="Contraseña"
              name="password"
              rules={[{ required: true, message: "Por favor ingrese su contraseña" }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#f500a2" }} />}
                placeholder="Ingrese su contraseña"
              />
            </Form.Item>

            {/* Mostrar quién estamos reemplazando */}
            {selectedReplacement && (
              <Form.Item>
                <Text type="secondary">
                  Reemplazando a: <Tag color="magenta">{selectedReplacement.nombre}</Tag>
                </Text>
              </Form.Item>
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{
                  width: "100%",
                  backgroundColor: "#f500a2",
                  borderColor: "#f500a2",
                  fontWeight: 500,
                }}
              >
                {loading ? "Cargando..." : "Iniciar Sesión"}
              </Button>
            </Form.Item>

            <Form.Item>
              <Button
                type="link"
                onClick={showReplaceModal}
                style={{
                  width: "100%",
                  color: "#f500a2",
                  fontWeight: 500,
                  textAlign: "center",
                }}
              >
                Reemplazo de turno
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Fade>

      {/* Modal para seleccionar reemplazo de turno */}
      <Modal
        title="Selecciona un reemplazo"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={400}
      >
        <List
          dataSource={users}
          renderItem={(user) => (
            <List.Item
              onClick={() => handleReplace(user)}
              style={{ cursor: "pointer" }}
            >
              {user.nombre}
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default Login;
