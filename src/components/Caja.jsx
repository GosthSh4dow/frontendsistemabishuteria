// src/components/Cajas.jsx

import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  message,
  Spin,
  Typography,
  Row,
  Col,
  Tag,
  Statistic,
  Divider,
  Checkbox,
} from "antd";
import {
  DollarCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  BankOutlined,
} from "@ant-design/icons";
import axios from "axios";
import API_BASE_URL from "../config/api";
import { useUser } from "../UserContext";

const { Title, Text } = Typography;

const pastelColors = {
  green: "#28b463",
  red: "#e74c3c",
  blue: "#2980b9",
  pink: "#C71585",
};

const Cajas = ({ selectedSucursal }) => {
  const { user } = useUser();
  const token = localStorage.getItem("authToken");

  const [caja, setCaja] = useState(null);
  const [loading, setLoading] = useState(false);

  const [abrirModalVisible, setAbrirModalVisible] = useState(false);
  const [cerrarModalVisible, setCerrarModalVisible] = useState(false);
  const [editarModalVisible, setEditarModalVisible] = useState(false);
  const [registrarEgresoVisible, setRegistrarEgresoVisible] = useState(false);

  const [formAbrir] = Form.useForm();
  const [formCerrar] = Form.useForm();
  const [formEditar] = Form.useForm();
  const [formEgreso] = Form.useForm();

  const [saldoDisponible, setSaldoDisponible] = useState(0);

  useEffect(() => {
    if (!token) {
      window.location.href = "/";
    }
  }, [token]);

  useEffect(() => {
    if (selectedSucursal) {
      fetchCaja(selectedSucursal);
    }
  }, [selectedSucursal]);

  const fetchCaja = async (id_sucursal) => {
    if (!id_sucursal) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/cajas/status`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { id_sucursal },
      });
      setCaja(response.data);
      setSaldoDisponible(parseFloat(response.data.saldo_final));
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setCaja(null);
        setSaldoDisponible(0);
      } else {
        message.error("Error al obtener el estado de la caja");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirCaja = async (values) => {
    if (!selectedSucursal) {
      message.error("No se ha seleccionado una sucursal.");
      return;
    }

    let saldo_inicial = parseFloat(values.saldo_inicial);
    if (isNaN(saldo_inicial)) {
      message.error("Saldo inicial inválido.");
      return;
    }

    const payload = {
      id_sucursal: selectedSucursal,
      saldo_inicial,
      rol: user.rol,
    };

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/cajas/open`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Caja abierta exitosamente");
      fetchCaja(selectedSucursal);
      setAbrirModalVisible(false);
      formAbrir.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || "Error al abrir la caja");
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarCaja = async (values) => {
    if (!selectedSucursal) {
      message.error("No se ha seleccionado una sucursal.");
      return;
    }

    const ingresos = parseFloat(values.ingresos);
    const egresos = parseFloat(values.egresos);
    const justificacion = values.justificacion;

    if (isNaN(ingresos) || isNaN(egresos)) {
      message.error("Ingresos o Egresos inválidos.");
      return;
    }

    if (egresos > 0 && (!justificacion || justificacion.trim() === "")) {
      message.error("Debe justificar los egresos.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        id_sucursal: selectedSucursal,
        cerrado_por: user.id,
        ingresos,
        egresos,
        justificacion: egresos > 0 ? justificacion : null,
      };
      await axios.post(`${API_BASE_URL}/cajas/close`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Caja cerrada exitosamente");
      fetchCaja(selectedSucursal);
      setCerrarModalVisible(false);
      formCerrar.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || "Error al cerrar la caja");
    } finally {
      setLoading(false);
    }
  };

  const handleEditarCaja = async (values) => {
    if (!selectedSucursal || !caja) {
      message.error("No hay una caja abierta para editar.");
      return;
    }

    const payload = {
      id_sucursal: selectedSucursal,
      caja_id: caja.id,
      saldo_inicial: parseFloat(values.saldo_inicial),
      ingresos: parseFloat(values.ingresos),
      egresos: parseFloat(values.egresos),
    };

    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/cajas/edit`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Caja actualizada exitosamente");
      fetchCaja(selectedSucursal);
      setEditarModalVisible(false);
      formEditar.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || "Error al editar la caja");
    } finally {
      setLoading(false);
    }
  };

  const confirmCerrarCaja = () => {
    if (!caja) return;
    Modal.confirm({
      title: "¿Estás seguro de cerrar la caja?",
      icon: <ExclamationCircleOutlined />,
      content: "Esta acción cerrará la caja y no se podrá modificar.",
      okText: "Sí, cerrar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: () => {
        setCerrarModalVisible(true);
      },
    });
  };

  const handleRegistrarEgreso = async (values) => {
    if (!selectedSucursal || !caja) {
      message.error("No hay una caja abierta para registrar egresos.");
      return;
    }

    const monto = parseFloat(values.monto);
    if (isNaN(monto) || monto <= 0) {
      message.error("Monto de egreso inválido.");
      return;
    }

    if (monto > saldoDisponible) {
      message.error("El monto del egreso excede el saldo disponible.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/cajas/${caja.id}/egresos`, { monto }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Egreso registrado exitosamente");
      fetchCaja(selectedSucursal);
      setRegistrarEgresoVisible(false);
      formEgreso.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || "Error al registrar el egreso");
    } finally {
      setLoading(false);
    }
  };

  const renderTarjetas = () => {
    return (
      <>
        <Row gutter={[16, 16]} style={{ marginTop: "16px" }}>
          <Col xs={24} sm={12} md={8}>
            <Card
              bordered={false}
              style={{
                backgroundColor: pastelColors.green,
                borderLeft: `5px solid ${pastelColors.green}`,
                color: "#ffffff",
                height: "150px",
              }}
            >
              <Statistic
                title={
                  <span style={{ fontSize: "18px" }}>
                    <ArrowUpOutlined style={{ color: "#ffffff", marginRight: "8px" }} />
                    Ingresos
                  </span>
                }
                value={caja ? parseFloat(caja.ingresos).toFixed(2) : "0.00"}
                precision={2}
                valueStyle={{ color: "#ffffff", fontSize: "24px" }}
                suffix="Bs."
              />
              <Divider style={{ borderColor: "#ffffff" }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card
              bordered={false}
              style={{
                backgroundColor: pastelColors.red,
                borderLeft: `5px solid ${pastelColors.red}`,
                color: "#ffffff",
                height: "150px",
              }}
            >
              <Statistic
                title={
                  <span style={{ fontSize: "18px" }}>
                    <ArrowDownOutlined style={{ color: "#ffffff", marginRight: "8px" }} />
                    Egresos
                  </span>
                }
                value={caja ? parseFloat(caja.egresos).toFixed(2) : "0.00"}
                precision={2}
                valueStyle={{ color: "#ffffff", fontSize: "24px" }}
                suffix="Bs."
              />
              <Divider style={{ borderColor: "#ffffff" }} />
            </Card>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Card
              bordered={false}
              style={{
                backgroundColor: pastelColors.blue,
                borderLeft: `5px solid ${pastelColors.blue}`,
                color: "#ffffff",
                height: "150px",
              }}
            >
              <Statistic
                title={
                  <span style={{ fontSize: "18px" }}>
                    <ExclamationCircleOutlined style={{ color: "#ffffff", marginRight: "8px" }} />
                    Total Cajas
                  </span>
                }
                value={caja ? parseFloat(caja.saldo_final).toFixed(2) : "0.00"}
                precision={2}
                valueStyle={{ color: "#ffffff", fontSize: "24px" }}
                suffix="Bs."
              />
              <Divider style={{ borderColor: "#ffffff" }} />
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  const renderHeader = () => {
    if (!selectedSucursal) return null;

    return (
      <Row justify="start" align="middle" style={{ marginBottom: "16px" }}>
        <Col>
          <Title
            level={2}
            style={{ fontSize: "24px", display: "flex", alignItems: "center" }}
          >
            <BankOutlined style={{ marginRight: "8px", color: pastelColors.pink }} />
            {caja ? caja.sucursal.nombre : "Sucursal No Seleccionada"}
            {caja && (
              <Tag
                color={caja.estado === "abierta" ? pastelColors.green : pastelColors.red}
                style={{ marginLeft: "10px", fontSize: "14px" }}
              >
                {caja.estado === "abierta" ? "Caja Abierta" : "Caja Cerrada"}
              </Tag>
            )}
          </Title>
        </Col>
      </Row>
    );
  };

  const renderEstadoCaja = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
        </div>
      );
    }

    if (!selectedSucursal) {
      return (
        <Card style={{ textAlign: "center", marginTop: "16px" }}>
          <p>Por favor seleccione una sucursal.</p>
        </Card>
      );
    }

    if (!caja) {
      return (
        <Card style={{ textAlign: "center", marginTop: "16px" }}>
          <p>No hay una caja abierta para esta sucursal.</p>
          <Button
            type="primary"
            onClick={() => {
              setAbrirModalVisible(true);
              formAbrir.resetFields();
            }}
            style={{ backgroundColor: pastelColors.green, borderColor: pastelColors.green }}
            icon={<PlusOutlined />}
            disabled={!selectedSucursal}
          >
            Abrir Caja
          </Button>
        </Card>
      );
    }

    if (caja.estado === "cerrada") {
      return (
        <Card style={{ textAlign: "center", marginTop: "16px" }}>
          <p>La caja está cerrada.</p>
          <Button
            type="primary"
            onClick={() => {
              setAbrirModalVisible(true);
              formAbrir.resetFields();
            }}
            style={{ backgroundColor: pastelColors.green, borderColor: pastelColors.green }}
            icon={<PlusOutlined />}
          >
            Abrir Caja
          </Button>
        </Card>
      );
    }

    return (
      <Card style={{ marginTop: "16px" }}>
        <Row justify="end" style={{ marginTop: "16px" }} gutter={[16, 16]}>
          {user.rol === "administrador" ? (
            <>
              <Col>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    formEditar.setFieldsValue({
                      saldo_inicial: caja.saldo_inicial,
                      ingresos: caja.ingresos,
                      egresos: caja.egresos,
                    });
                    setEditarModalVisible(true);
                  }}
                >
                  Editar Caja
                </Button>
              </Col>
              <Col>
                <Button
                  type="primary"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={confirmCerrarCaja}
                >
                  Cerrar Caja
                </Button>
              </Col>
            </>
          ) : (
            <>
              <Col>
                <Button
                  type="primary"
                  icon={<MinusCircleOutlined />}
                  onClick={() => {
                    setRegistrarEgresoVisible(true);
                    formEgreso.resetFields();
                  }}
                >
                  Registrar Egreso
                </Button>
              </Col>
              <Col>
                <Button
                  type="primary"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={confirmCerrarCaja}
                >
                  Cerrar Caja
                </Button>
              </Col>
            </>
          )}
        </Row>
      </Card>
    );
  };

  const handleModalClose = (modalType) => {
    switch (modalType) {
      case "abrir":
        formAbrir.resetFields();
        break;
      case "cerrar":
        formCerrar.resetFields();
        break;
      case "editar":
        formEditar.resetFields();
        break;
      case "egreso":
        formEgreso.resetFields();
        break;
      default:
        break;
    }
  };

  return (
    <div style={{ marginTop: "16px", padding: "24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <DollarCircleOutlined style={{ fontSize: "24px", color: pastelColors.pink }} />
        <Title level={3} style={{ margin: 0, fontSize: "24px" }}>
          Cajas
        </Title>
      </div>

      {renderTarjetas()}
      {renderHeader()}
      {renderEstadoCaja()}

      {/* Modal Abrir Caja */}
      <Modal
        title={user.rol === "administrador" ? "Abrir Caja (Administrador)" : "Abrir Caja"}
        visible={abrirModalVisible}
        onCancel={() => {
          setAbrirModalVisible(false);
          handleModalClose("abrir");
        }}
        onOk={() => formAbrir.submit()}
        okText="Abrir"
        cancelText="Cancelar"
        confirmLoading={loading}
        afterClose={() => formAbrir.resetFields()}
      >
        <Form form={formAbrir} layout="vertical" onFinish={handleAbrirCaja}>
          <Form.Item
            label="Saldo Inicial (Bs.)"
            name="saldo_inicial"
            rules={[
              {
                required: true,
                message: "Por favor ingrese el saldo inicial",
              },
              {
                validator: (_, value) => {
                  if (value === "" || value === undefined) {
                    return Promise.resolve();
                  }
                  if (!isNaN(parseFloat(value))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Saldo inicial inválido. Ingrese un número válido.")
                  );
                },
              },
            ]}
            initialValue={0.0}
          >
            <Input
              placeholder="Ej: 1000.00"
              type="number"
              min={0}
            />
          </Form.Item>
          {user.rol === "administrador" && (
            <Form.Item
              name="mantener_saldo"
              valuePropName="checked"
              initialValue={false}
            >
              <Checkbox
                onChange={(e) => {
                  if (e.target.checked && caja) {
                    formAbrir.setFieldsValue({ saldo_inicial: parseFloat(caja.saldo_final).toFixed(2) });
                  } else {
                    formAbrir.setFieldsValue({ saldo_inicial: 0.0 });
                  }
                }}
              >
                ¿Desea mantener el saldo inicial anterior?
              </Checkbox>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Modal Cerrar Caja */}
      <Modal
        title="Cerrar Caja"
        visible={cerrarModalVisible}
        onCancel={() => {
          setCerrarModalVisible(false);
          handleModalClose("cerrar");
        }}
        onOk={() => formCerrar.submit()}
        okText="Cerrar Caja"
        cancelText="Cancelar"
        confirmLoading={loading}
        afterClose={() => formCerrar.resetFields()}
      >
        <Form form={formCerrar} layout="vertical" onFinish={handleCerrarCaja}>
          <Form.Item
            label="Ingresos (Bs.)"
            name="ingresos"
            rules={[
              {
                required: true,
                message: "Por favor ingrese los ingresos",
              },
              {
                validator: (_, value) => {
                  if (!isNaN(parseFloat(value))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Ingresos inválidos. Ingrese un número válido.")
                  );
                },
              },
            ]}
            initialValue={caja ? parseFloat(caja.ingresos).toFixed(2) : 0.0}
          >
            <Input
              placeholder="Ej: 500.00"
              type="number"
              min={0}
              disabled={user.rol !== "administrador"}
            />
          </Form.Item>
          <Form.Item
            label="Egresos (Bs.)"
            name="egresos"
            rules={[
              {
                required: true,
                message: "Por favor ingrese los egresos",
              },
              {
                validator: (_, value) => {
                  if (!isNaN(parseFloat(value))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Egresos inválidos. Ingrese un número válido.")
                  );
                },
              },
            ]}
            initialValue={caja ? parseFloat(caja.egresos).toFixed(2) : 0.0}
          >
            <Input
              placeholder="Ej: 200.00"
              type="number"
              min={0}
              disabled={user.rol !== "administrador"}
            />
          </Form.Item>
          {user.rol === "administrador" && (
            <Form.Item
              label="Total (Bs.)"
              name="total"
              initialValue={caja ? parseFloat(caja.saldo_final).toFixed(2) : 0.0}
            >
              <Input
                placeholder="Total"
                type="number"
                min={0}
                disabled
              />
            </Form.Item>
          )}
          <Form.Item
            label="Justificación de Egresos"
            name="justificacion"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const egresos = parseFloat(getFieldValue("egresos"));
                  if (egresos > 0 && (!value || value.trim() === "")) {
                    return Promise.reject(
                      new Error("Debe justificar los egresos.")
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input.TextArea
              placeholder="Justificación de los egresos"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Editar Caja (Solo Administradores) */}
      {user.rol === "administrador" && caja && caja.estado === "abierta" && (
        <Modal
          title="Editar Caja"
          visible={editarModalVisible}
          onCancel={() => {
            setEditarModalVisible(false);
            handleModalClose("editar");
          }}
          onOk={() => formEditar.submit()}
          okText="Guardar Cambios"
          cancelText="Cancelar"
          confirmLoading={loading}
          afterClose={() => formEditar.resetFields()}
        >
          <Form form={formEditar} layout="vertical" onFinish={handleEditarCaja}>
            <Form.Item
              label="Saldo Inicial (Bs.)"
              name="saldo_inicial"
              rules={[
                {
                  required: true,
                  message: "Por favor ingrese el saldo inicial",
                },
                {
                  validator: (_, value) => {
                    if (value === "" || value === undefined) {
                      return Promise.resolve();
                    }
                    if (!isNaN(parseFloat(value))) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Saldo inicial inválido. Ingrese un número válido.")
                    );
                  },
                },
              ]}
              initialValue={caja ? parseFloat(caja.saldo_inicial).toFixed(2) : 0.0}
            >
              <Input
                placeholder="Ej: 1000.00"
                type="number"
                min={0}
              />
            </Form.Item>
            <Form.Item
              label="Ingresos (Bs.)"
              name="ingresos"
              rules={[
                {
                  required: true,
                  message: "Por favor ingrese los ingresos",
                },
                {
                  validator: (_, value) => {
                    if (value === "" || value === undefined) {
                      return Promise.resolve();
                    }
                    if (!isNaN(parseFloat(value))) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Ingresos inválidos. Ingrese un número válido.")
                    );
                  },
                },
              ]}
              initialValue={caja ? parseFloat(caja.ingresos).toFixed(2) : 0.0}
            >
              <Input
                placeholder="Ej: 500.00"
                type="number"
                min={0}
              />
            </Form.Item>
            <Form.Item
              label="Egresos (Bs.)"
              name="egresos"
              rules={[
                {
                  required: true,
                  message: "Por favor ingrese los egresos",
                },
                {
                  validator: (_, value) => {
                    if (value === "" || value === undefined) {
                      return Promise.resolve();
                    }
                    if (!isNaN(parseFloat(value))) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Egresos inválidos. Ingrese un número válido.")
                    );
                  },
                },
              ]}
              initialValue={caja ? parseFloat(caja.egresos).toFixed(2) : 0.0}
            >
              <Input
                placeholder="Ej: 200.00"
                type="number"
                min={0}
              />
            </Form.Item>
          </Form>
        </Modal>
      )}

      {/* Modal Registrar Egreso */}
      <Modal
        title="Registrar Egreso"
        visible={registrarEgresoVisible}
        onCancel={() => {
          setRegistrarEgresoVisible(false);
          handleModalClose("egreso");
        }}
        onOk={() => formEgreso.submit()}
        okText="Registrar"
        cancelText="Cancelar"
        confirmLoading={loading}
        afterClose={() => formEgreso.resetFields()}
      >
        <Text strong style={{ fontSize: "16px", marginBottom: "16px", display: 'block' }}>
          Saldo Disponible: Bs. {saldoDisponible.toFixed(2)}
        </Text>
        <Form form={formEgreso} layout="vertical" onFinish={handleRegistrarEgreso}>
          <Form.Item
            label="Monto del Egreso (Bs.)"
            name="monto"
            rules={[
              {
                required: true,
                message: "Por favor ingrese el monto del egreso",
              },
              {
                validator: (_, value) => {
                  if (value === "" || value === undefined) {
                    return Promise.resolve();
                  }
                  if (!isNaN(parseFloat(value)) && parseFloat(value) > 0) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Monto inválido. Ingrese un número positivo válido.")
                  );
                },
              },
            ]}
          >
            <Input placeholder="Ej: 50.00" type="number" min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Cajas;
