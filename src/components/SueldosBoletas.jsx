import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Tag, Row, Col, Typography, Select, InputNumber } from 'antd';
import { FileTextOutlined, PrinterOutlined } from '@ant-design/icons';
import axios from 'axios';
import baseURL from '../config/api';
import moment from 'moment';
import jsPDF from 'jspdf';
import 'moment/locale/es';
import 'jspdf-autotable'; 

moment.locale('es');
const { Option } = Select;
const { Title } = Typography;

const SueldosBoletas = () => {
  const [empleados, setEmpleados] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [boletas, setBoletas] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [asistenciaEditada, setAsistenciaEditada] = useState(null);
  const [isResumenModalVisible, setIsResumenModalVisible] = useState(false);
  const [resumen, setResumen] = useState({});
  const [montoTurno, setMontoTurno] = useState(50); // Monto por turno inicial
  const [totalSueldo, setTotalSueldo] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const fetchEmpleados = async () => {
    try {
      const response = await axios.get(`${baseURL}/usuarios`);
      setEmpleados(response.data);
    } catch (error) {
      message.error('Error al cargar empleados');
    }
  };

  const fetchAsistencias = async (empleadoId, fechaPago) => {
    if (!empleadoId) return;
  
    try {
      const response = await axios.get(`${baseURL}/asistencias/${empleadoId}`);
  
      // Si hay fecha de pago (es decir, ya existen boletas), filtramos por esa fecha
      const asistenciasFiltradas = fechaPago 
        ? response.data.filter(asistencia => moment(asistencia.fecha).isAfter(moment(fechaPago))) 
        : response.data;
  
      setAsistencias(asistenciasFiltradas); // Actualizamos el estado con las asistencias filtradas
    } catch (error) {
      message.error('Error al cargar asistencias');
    }
  };
  
  const fetchBoletas = async (empleadoId) => {
    try {
      const response = await axios.get(`${baseURL}/boletas`);
      const boletasFiltradas = response.data.filter(boleta => boleta.id_usuario === empleadoId);
      setBoletas(boletasFiltradas);
  
      if (boletasFiltradas.length > 0) {
        // Si hay boletas, filtramos las asistencias a partir de la última boleta de pago
        const ultimaBoleta = boletasFiltradas.reduce((max, boleta) => (moment(boleta.fecha_pago).isAfter(moment(max.fecha_pago)) ? boleta : max), boletasFiltradas[0]);
        fetchAsistencias(empleadoId, ultimaBoleta.fecha_pago); // Filtramos las asistencias posteriores a la última boleta
      } else {
        // Si no hay boletas, mostramos todas las asistencias
        fetchAsistencias(empleadoId); // Mostramos todas las asistencias
      }
    } catch (error) {
      message.error('Error al cargar boletas');
    }
  };
  const handleSeleccionarEmpleado = (empleadoId) => {
    const empleado = empleados.find(emp => emp.id === empleadoId);
    setEmpleadoSeleccionado(empleado);
    fetchBoletas(empleadoId);
  };

  const handleMontoTurnoChange = (value) => {
    setMontoTurno(value);
    calcularTotalSueldo(value);
  };

  const calcularTotalSueldo = (nuevoMonto) => {
    let totalSueldoCalculated = 0;
    asistencias.forEach(item => {
      if (item.estado === "Asistido" || item.estado === "Reemplazo") {
        totalSueldoCalculated += nuevoMonto;
      }
    });
    setTotalSueldo(totalSueldoCalculated);
  };

  const handleGenerarBoleta = async () => {
    if (!empleadoSeleccionado) {
      message.warning("Seleccione un empleado para generar la boleta.");
      return;
    }

    let asistenciasCount = 0;
    let faltasInjustificadas = 0;
    let faltasJustificadas = 0;
    let reemplazosCount = 0;

    asistencias.forEach(item => {
      if (item.estado === "Asistido") asistenciasCount++;
      if (item.estado === "Falta") {
        if (item.justificado === 1) faltasJustificadas++;
        else faltasInjustificadas++;
      }
      if (item.estado === "Reemplazo") reemplazosCount++;
    });

    const totalSueldoCalculated = asistenciasCount * montoTurno + reemplazosCount * montoTurno;

    setResumen({
      montoTurno,
      asistenciasCount,
      faltasInjustificadas,
      faltasJustificadas,
      reemplazosCount,
      totalSueldo: totalSueldoCalculated,
    });
    setTotalSueldo(totalSueldoCalculated);
    setIsResumenModalVisible(true);
  };

  const confirmGenerarBoleta = async () => {
    try {
      const boletaData = {
        id_usuario: empleadoSeleccionado.id,
        monto_turno: montoTurno,
        total: totalSueldo,
        asistencias_count: resumen.asistenciasCount,
        faltas_injustificadas: resumen.faltasInjustificadas,
        faltas_justificadas: resumen.faltasJustificadas,
        reemplazos_count: resumen.reemplazosCount,
        fecha_pago: new Date(),
      };

      await axios.post(`${baseURL}/boletas`, boletaData);
      message.success('Boleta generada exitosamente');
      setIsResumenModalVisible(false);
      fetchBoletas(empleadoSeleccionado.id);
    } catch (error) {
      message.error('Error al generar boleta');
    }
  };

  const handleEditarAsistencia = (asistencia) => {
    setAsistenciaEditada(asistencia);
    setIsModalVisible(true);
  };

  const handleActualizarAsistencia = async (values) => {
    try {
      const payload = {
        estado: values.estado,
        justificado: values.estado === "Falta" ? (values.justificado === "Justificada") : null,
        reemplazo: values.estado === "Reemplazo" ? values.reemplazo_id : null,
      };

      await axios.put(`${baseURL}/asistencias/${asistenciaEditada.id}`, payload);
      message.success("Asistencia actualizada exitosamente.");
      setIsModalVisible(false);
      setAsistenciaEditada(null);
      fetchAsistencias(empleadoSeleccionado.id, new Date());
    } catch (error) {
      message.error("Error al actualizar asistencia.");
    }
  };

  const asistenciaColumns = [
    { title: "Fecha", dataIndex: "fecha", key: "fecha", render: (fecha) => moment(fecha).format('D [de] MMMM [de] YYYY') },
    { title: "Hora de Ingreso", dataIndex: "ingreso", key: "ingreso" },
    { title: "Hora de Salida", dataIndex: "salida", key: "salida" },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (estado) => (
        <Tag color={estado === "Asistido" ? "green" : estado === "Falta" ? "red" : "orange"}>{estado}</Tag>
      ),
    },
    {
      title: "Justificación",
      dataIndex: "justificado",
      key: "justificado",
      render: (justificado) => {
        if (justificado === null) return '-';
        return justificado === 1 ? 'Justificada' : 'No Justificada';
      },
    },
    {
      title: "Reemplazo",
      dataIndex: "reemplazo",
      key: "reemplazo",
      render: (reemplazo) => reemplazo ? reemplazo.nombre : "-",
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (text, record) => (
        <Button type="link" onClick={() => handleEditarAsistencia(record)}>
          Editar
        </Button>
      ),
    },
  ];

  const boletaColumns = [
    { title: "Empleado", dataIndex: "usuario", key: "empleado", render: (usuario) => usuario ? usuario.nombre : "-" },
    { title: "Total", dataIndex: "total", key: "total", render: (total) => `${total} Bs` }, 
    { title: "Fecha de Pago", dataIndex: "fecha_pago", key: "fecha_pago", render: (fecha) => moment(fecha).format('D [de] MMMM [de] YYYY') },
  ];

  const renderModal = () => (
    <Modal title="Editar Asistencia" visible={isModalVisible} onCancel={() => setIsModalVisible(false)} onOk={() => { form.submit(); }} >
      <Form layout="vertical" initialValues={{ estado: asistenciaEditada?.estado, justificado: asistenciaEditada?.justificado === 1 ? "Justificada" : "No Justificada", }} form={form} onFinish={handleActualizarAsistencia} >
        <Form.Item label="Estado" name="estado">
          <Select onChange={(value) => { form.setFieldsValue({ estado: value }); }} value={asistenciaEditada?.estado}>
            <Option value="Asistido">Asistido</Option>
            <Option value="Falta">Falta</Option>
            <Option value="Reemplazo">Reemplazo</Option>
          </Select>
        </Form.Item>
        <div>
          <Form.Item label="Justificación" name="justificado" shouldUpdate={(prevValues, currentValues) => prevValues.estado !== currentValues.estado}>
            <Select disabled={form.getFieldValue("estado") !== "Falta"} >
              <Option value="Justificada">Justificada</Option>
              <Option value="No Justificada">No Justificada</Option>
            </Select>
          </Form.Item>
        </div>
        <div>
          <Form.Item label="Reemplazo" name="reemplazo_id" shouldUpdate={(prevValues, currentValues) => prevValues.estado !== currentValues.estado}>
            <Select disabled={form.getFieldValue("estado") !== "Reemplazo"} >
              {empleados.map((emp) => (
                <Option key={emp.id} value={emp.id}>{emp.nombre}</Option>
              ))}
            </Select>
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );

  const handleGenerarPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica');
    doc.addImage('/logo.jpeg', 'JPEG', 10, 10, 20, 20); 
    doc.setFontSize(18);
    doc.text("Lista de Asistencia", 70, 20);
    doc.setFontSize(14);
    if (empleadoSeleccionado) {
      doc.text(`Usuario: ${empleadoSeleccionado.nombre}`, 10, 40); 
    }
    doc.autoTable({
      startY: 50, 
      head: [
        ["Fecha", "Hora de Ingreso", "Hora de Salida", "Estado", "Justificación", "Reemplazo"]
      ],
      body: asistencias.map(item => [
        moment(item.fecha).format('D [de] MMMM [de] YYYY'),
        item.ingreso,
        item.salida,
        item.estado,
        item.justificado === 1 ? 'Justificada' : item.justificado === 0 ? 'No Justificada' : '-',
        item.reemplazo ? item.reemplazo.nombre : '-'
      ]),
      margin: { top: 50, bottom: 10 },
      theme: 'grid',
    });
    doc.save(`lista_asistencia_${empleadoSeleccionado.nombre}.pdf`);
  };
  return (
    <div>
      <Row gutter={16}>
        <Col span={12}>
          <Select style={{ width: "100%" }} placeholder="Selecciona un empleado" onChange={handleSeleccionarEmpleado}>
            {empleados.map(emp => (
              <Option key={emp.id} value={emp.id}>{emp.nombre}</Option>
            ))}
          </Select>
        </Col>
        <Col span={12}>
          <InputNumber value={montoTurno} min={0} max={10000} step={1} onChange={handleMontoTurnoChange} style={{ width: '100%' }} placeholder="Monto por turno" />
        </Col>
      </Row>
      <Table
        rowKey="id"
        columns={asistenciaColumns}
        dataSource={asistencias}
        pagination={false}
        scroll={{ y: 240 }}
        style={{ marginTop: 16 }}
        locale={{ emptyText: "No hay registros" }}
      />
      
      <Button
        type="primary"
        icon={<FileTextOutlined />}
        style={{ marginTop: 16 }}
        onClick={handleGenerarBoleta}
      >
        Generar Boleta
      </Button>
      
      <Button
        type="default"
        icon={<PrinterOutlined />}
        style={{ marginTop: 16, marginLeft: 8 }}
        onClick={handleGenerarPDF}
      >
        Imprimir Asistencia
      </Button>
      
      <Table
        rowKey="id"
        columns={boletaColumns}
        dataSource={boletas}
        pagination={{ pageSize: 6 }}
        scroll={{ y: 240 }}
        style={{ marginTop: 16 }}
        locale={{ emptyText: "No hay boletas generadas" }}
      />
      
      {renderModal()}

      <Modal
        title="Resumen de Boleta"
        visible={isResumenModalVisible}
        onOk={confirmGenerarBoleta}
        onCancel={() => setIsResumenModalVisible(false)}
      >
        <p><strong>Nombre:</strong> {empleadoSeleccionado?.nombre}</p>
        <p><strong>Fecha:</strong> {moment().format('D [de] MMMM [de] YYYY')}</p>

        <Table
          columns={[
            { title: "Asistencias", dataIndex: "asistenciasCount", key: "asistenciasCount" },
            { title: "Faltas Injustificadas", dataIndex: "faltasInjustificadas", key: "faltasInjustificadas" },
            { title: "Faltas Justificadas", dataIndex: "faltasJustificadas", key: "faltasJustificadas" },
            { title: "Reemplazos", dataIndex: "reemplazosCount", key: "reemplazosCount" },
          ]}
          dataSource={[{
            asistenciasCount: resumen.asistenciasCount,
            faltasInjustificadas: resumen.faltasInjustificadas,
            faltasJustificadas: resumen.faltasJustificadas,
            reemplazosCount: resumen.reemplazosCount
          }]}
          pagination={false}
        />
        <p><strong>Total a Pagar:</strong> {totalSueldo} Bs</p>
      </Modal>
    </div>
  );
};

export default SueldosBoletas;
