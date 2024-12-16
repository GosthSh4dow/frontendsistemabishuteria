// AsistenciaReemplazos.jsx
import React, { useState } from 'react';
import { Table, Button, DatePicker, Modal, Form, Input, Select, message, Row, Col, Popconfirm } from 'antd';
import { ClockCircleOutlined, SwapOutlined } from '@ant-design/icons';

const { Option } = Select;

const AsistenciaReemplazos = () => {
  // Estado para gestionar la lista de asistencia y reemplazos
  const [asistenciaData, setAsistenciaData] = useState([]);
  const [reemplazoData, setReemplazoData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);

  // Funciones para manejar la modal
  const showModal = (record) => {
    setCurrentRecord(record);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
    // Aquí implementamos la lógica para guardar o editar el registro de asistencia o reemplazo
    message.success('Asistencia/Reemplazo actualizado');
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // Función para registrar asistencia
  const handleAddAsistencia = () => {
    const newAsistencia = {
      id: asistenciaData.length + 1,
      nombre: 'Juan Pérez',
      turno: 'Mañana',
      fecha: new Date().toLocaleDateString(),
      horaEntrada: '08:00',
      horaSalida: '16:00',
    };
    setAsistenciaData([...asistenciaData, newAsistencia]);
    message.success('Asistencia registrada');
  };

  // Función para registrar reemplazo de turno
  const handleAddReemplazo = () => {
    const newReemplazo = {
      id: reemplazoData.length + 1,
      nombreReemplazante: 'Carlos Gómez',
      turnoOriginal: 'Tarde',
      turnoReemplazo: 'Mañana',
      fecha: new Date().toLocaleDateString(),
    };
    setReemplazoData([...reemplazoData, newReemplazo]);
    message.success('Reemplazo de turno registrado');
  };

  // Función para confirmar reemplazo de turno
  const confirmReemplazo = (id) => {
    setReemplazoData(reemplazoData.filter(item => item.id !== id));
    message.success('Reemplazo confirmado');
  };

  // Columnas para la tabla de Asistencia
  const asistenciaColumns = [
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre' },
    { title: 'Turno', dataIndex: 'turno', key: 'turno' },
    { title: 'Fecha', dataIndex: 'fecha', key: 'fecha' },
    { title: 'Hora de Entrada', dataIndex: 'horaEntrada', key: 'horaEntrada' },
    { title: 'Hora de Salida', dataIndex: 'horaSalida', key: 'horaSalida' },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (text, record) => (
        <Button type="link" onClick={() => showModal(record)}>Ver</Button>
      ),
    },
  ];

  // Columnas para la tabla de Reemplazos
  const reemplazoColumns = [
    { title: 'Nombre del Reemplazante', dataIndex: 'nombreReemplazante', key: 'nombreReemplazante' },
    { title: 'Turno Original', dataIndex: 'turnoOriginal', key: 'turnoOriginal' },
    { title: 'Turno de Reemplazo', dataIndex: 'turnoReemplazo', key: 'turnoReemplazo' },
    { title: 'Fecha', dataIndex: 'fecha', key: 'fecha' },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (text, record) => (
        <Popconfirm
          title="¿Estás seguro de que quieres confirmar este reemplazo?"
          onConfirm={() => confirmReemplazo(record.id)}
          okText="Sí"
          cancelText="No"
        >
          <Button type="link" icon={<SwapOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col span={12}>
          <Button type="primary" icon={<ClockCircleOutlined />} onClick={handleAddAsistencia}>Registrar Asistencia</Button>
        </Col>
        <Col span={12}>
          <Button type="primary" icon={<SwapOutlined />} onClick={handleAddReemplazo}>Registrar Reemplazo de Turno</Button>
        </Col>
      </Row>

      <Table
        title={() => 'Lista de Asistencias'}
        columns={asistenciaColumns}
        dataSource={asistenciaData}
        rowKey="id"
        pagination={{ pageSize: 5 }}
      />

      <Table
        title={() => 'Lista de Reemplazos de Turno'}
        columns={reemplazoColumns}
        dataSource={reemplazoData}
        rowKey="id"
        pagination={{ pageSize: 5 }}
      />

      {/* Modal para ver o editar un registro de asistencia */}
      <Modal
        title="Detalles de Asistencia"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form layout="vertical">
          <Form.Item label="Nombre">
            <Input defaultValue={currentRecord?.nombre} disabled />
          </Form.Item>
          <Form.Item label="Turno">
            <Input defaultValue={currentRecord?.turno} disabled />
          </Form.Item>
          <Form.Item label="Fecha">
            <Input defaultValue={currentRecord?.fecha} disabled />
          </Form.Item>
          <Form.Item label="Hora de Entrada">
            <Input defaultValue={currentRecord?.horaEntrada} disabled />
          </Form.Item>
          <Form.Item label="Hora de Salida">
            <Input defaultValue={currentRecord?.horaSalida} disabled />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AsistenciaReemplazos;
