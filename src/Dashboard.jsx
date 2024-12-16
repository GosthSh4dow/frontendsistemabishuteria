import React, { useState, useEffect } from "react";
import { Layout, Menu, Avatar, Typography, Button, Modal, message } from "antd";
import {
  UserOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  DeliveredProcedureOutlined,
  AppstoreOutlined,
  TagsOutlined,
  DollarCircleOutlined,
  BankOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { useUser } from "./UserContext";
import axios from "axios";
import API_BASE_URL from "./config/api";

// Importa tus componentes
import Sucursales from "./components/Sucursales";
import Usuarios from "./components/Usuarios";
import Proveedores from "./components/Proveedores";
import Ventas from "./components/Ventas";
import SueldosBoletas from "./components/SueldosBoletas";
import Promociones from "./components/Promociones";
import Productos from "./components/Productos";
import Cajas from "./components/Caja"; // Importamos el componente Cajas
import Reportes from "./components/Reportes"; // Importa el componente Reportes

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { confirm } = Modal;

const Dashboard = () => {
  const { user, clearUserData } = useUser();
  const token = localStorage.getItem("authToken");

  const [selectedMenu, setSelectedMenu] = useState("ventas");
  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursal, setSelectedSucursal] = useState(null);

  useEffect(() => {
    if (!token) {
      window.location.href = "/";
    } else {
      fetchSucursales();
    }
  }, [token]);

  const fetchSucursales = async () => {
    try {
      if (user?.rol === "administrador") {
        // Obtener todas las sucursales
        const response = await axios.get(`${API_BASE_URL}/sucursales`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSucursales(response.data);
      } else {
        // Obtener sólo la sucursal del usuario
        if (user?.sucursal?.id) {
          const response = await axios.get(`${API_BASE_URL}/sucursales/${user.sucursal.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setSucursales([response.data]);
        } else {
          setSucursales([]);
        }
      }
    } catch (error) {
      console.error("Error al obtener sucursales:", error);
      message.error("Error al obtener sucursales");
    }
  };

  const handleMenuClick = (key) => {
    // Si el key empieza con caja_sucursal_, extraer el id
    if (key.startsWith("caja_sucursal_")) {
      const sucursalId = key.split("_")[2]; // ej: caja_sucursal_10 => ['caja','sucursal','10']
      setSelectedSucursal(parseInt(sucursalId, 10));
    }
    setSelectedMenu(key);
  };

 
  const handleLogout = async () => {
    confirm({
      title: "¿Estás seguro de que deseas cerrar sesión?",
      icon: <ExclamationCircleOutlined />,
      content: "Serás redirigido a la página de inicio de sesión.",
      okText: "Sí, salir",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          const horaSalida = new Date().toISOString(); 
          if (horaSalida) {
            await axios.post(`${API_BASE_URL}/asistencias/salida`, {
              id_usuario: user.id,
              salida: horaSalida,
            }, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          }
          clearUserData();
          window.location.href = "/";
        } catch (error) {
          console.error("Error al registrar la salida:", error);
        //  message.error("Error al registrar la salida.");
          clearUserData();
          window.location.href = "/";
        }
      },
    });
  };


  const renderContent = () => {
    // Si la clave del menú es una caja de sucursal
    if (selectedMenu.startsWith("caja_sucursal_") && selectedSucursal) {
      return <Cajas selectedSucursal={selectedSucursal} />;
    }

    // Caso contrario, renderizamos el contenido según el menú normal
    switch (selectedMenu) {
      case "usuarios":
        return <Usuarios />;
      case "sucursales":
        return <Sucursales />;
      case "productos":
        return <Productos />;
      case "promociones":
        return <Promociones />;
      case "ventas":
        return <Ventas />;
      case "sueldos":
        return <SueldosBoletas />;
      case "proveedores":
        return <Proveedores />;
      case "reportes": // Nuevo caso para Reportes
        return <Reportes />;
      default:
        return <Ventas />;
    }
  };

  const renderCajasMenu = () => {
    if (sucursales.length === 0) {
      return null;
    }

    return (
      <Menu.SubMenu key="cajas" icon={<DollarCircleOutlined />} title="Cajas">
        {sucursales.map((suc) => (
          <Menu.Item key={`caja_sucursal_${suc.id}`} icon={<BankOutlined />}>
            {suc.nombre}
          </Menu.Item>
        ))}
      </Menu.SubMenu>
    );
  };

  const renderMenuItems = () => {
    const menuItems = [];

    // Menú común para todos
    menuItems.push(
      <Menu.Item key="ventas" icon={<ShoppingCartOutlined />}>
        Ventas
      </Menu.Item>,
    <Menu.Item key="reportes" icon={<FilePdfOutlined />}>
    Reportes
  </Menu.Item>
    );

    // Menú para administrador
    if (user?.rol === "administrador") {
      menuItems.unshift(
        <Menu.Item key="usuarios" icon={<UserOutlined />}>
          Usuarios
        </Menu.Item>,
        <Menu.Item key="sucursales" icon={<TeamOutlined />}>
          Sucursales
        </Menu.Item>,
        <Menu.SubMenu
          key="gestionProductos"
          title="Gestión de Productos"
          icon={<ShopOutlined />}
        >
          <Menu.Item key="productos" icon={<AppstoreOutlined />}>
            Productos
          </Menu.Item>
          <Menu.Item key="promociones" icon={<TagsOutlined />}>
            Promociones
          </Menu.Item>
          <Menu.Item key="proveedores" icon={<DeliveredProcedureOutlined />}>
            Proveedores
          </Menu.Item>
        </Menu.SubMenu>,
          <Menu.Item key="sueldos" icon={<BarChartOutlined />}>
          Sueldos
        </Menu.Item>
        
      );
    }

    // Menú de cajas (para todos)
    const cajasMenu = renderCajasMenu();
    if (cajasMenu) {
      menuItems.push(cajasMenu);
    }

    return menuItems;
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Sider
        width={200}
        style={{
          background: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px 10px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <Avatar
            size={64}
            style={{
              backgroundColor: "#f500a2",
              fontSize: "24px",
            }}
          >
            {user?.nombre
              ?.split(" ")
              .map((word) => word[0])
              .join("")}
          </Avatar>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Title level={5} style={{ margin: 0 }}>
              {user?.nombre}
            </Title>
            <Text type="secondary">{user?.rol}</Text>
            <Text type="secondary">{user?.sucursal?.nombre}</Text>
          </div>
        </div>

        <Menu
          mode="inline"
          defaultSelectedKeys={["ventas"]}
          selectedKeys={[selectedMenu]}
          style={{ flexGrow: 1, borderRight: 0 }}
          onClick={(e) => handleMenuClick(e.key)}
        >
          {renderMenuItems()}
        </Menu>

        <div
          style={{
            textAlign: "center",
            padding: "10px 0",
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <Button
            type="text"
            icon={<LogoutOutlined style={{ color: "red" }} />}
            onClick={handleLogout}
            style={{ color: "red" }}
          >
            Cerrar Sesión
          </Button>
        </div>
      </Sider>

      <Layout>
        <Content
          style={{
            padding: 24,
            background: "#fff",
            minHeight: 280,
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
