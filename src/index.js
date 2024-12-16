import React from "react";
import ReactDOM from "react-dom";
import { ConfigProvider, theme } from "antd";
import App from "./App";
import { UserProvider } from './UserContext';

const { defaultAlgorithm } = theme;

// Definimos los colores corporativos
const customTheme = {
  algorithm: defaultAlgorithm,
  token: {
    colorPrimary: "#f500a2", // Fucsia
    colorSecondary: "#800080", // Lila
    colorBgBase: "#ffffff", // Blanco para fondos
    colorTextBase: "#000000", // Texto en negro para contraste
    colorTextLightSolid: "#ffffff", // Texto claro sobre botones
  },
};

ReactDOM.render(
  <ConfigProvider theme={customTheme}>
       <UserProvider>
      <App />
    </UserProvider>
  </ConfigProvider>,
  document.getElementById("root")
);
