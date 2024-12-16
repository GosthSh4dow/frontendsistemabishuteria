// GestionRRHH.jsx
import React from 'react';
import { Tabs, Row, Col, Card } from 'antd';
import AsistenciaReemplazos from './AsistenciaReemplazos';
import SueldosBoletas from './SueldosBoletas';

const { TabPane } = Tabs;

const GestionRRHH = () => {
  return (
    <Row justify="center" style={{ marginTop: '20px' }}>
      <Col span={20}>
        <Card title="Gestión RRHH" bordered={false}>
          <Tabs defaultActiveKey="1" type="card">
            <TabPane tab="Asistencia y Reemplazos" key="1">
              <AsistenciaReemplazos />
            </TabPane>
            <TabPane tab="Sueldos y Boletas" key="2">
              <SueldosBoletas />
            </TabPane>
          </Tabs>
        </Card>
      </Col>
    </Row>
  );
};

export default GestionRRHH;
