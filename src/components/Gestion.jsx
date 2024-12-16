import React, { useState } from "react";
import { Tabs } from "antd";
import Productos from "./Productos";
import Promociones from "./Promociones";

const { TabPane } = Tabs;

const Gestion = () => {
  const [activeTab, setActiveTab] = useState("productos");

  return (
    <Tabs
      defaultActiveKey="productos"
      activeKey={activeTab}
      onChange={(key) => setActiveTab(key)}
      centered
    >
      <TabPane tab="Productos" key="productos">
        <Productos />
      </TabPane>
      <TabPane tab="Promociones" key="promociones">
        <Promociones />
      </TabPane>
    </Tabs>
  );
};

export default Gestion;
