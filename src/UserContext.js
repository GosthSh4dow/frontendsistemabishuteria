import React, { createContext, useState, useContext } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [branch, setBranch] = useState(null);
  const [userId, setUserId] = useState(null);  // Nuevo estado para el id_usuario
  const [branchId, setBranchId] = useState(null);  // Nuevo estado para el id_sucursal

  const setUserData = (userData) => {
    setUser(userData);
    setBranch(userData?.sucursal || null);  // Asegúrate de que "sucursal" exista
    setUserId(userData?.id || null);  // Guardar el id_usuario
    setBranchId(userData?.id_sucursal || null);  // Guardar el id_sucursal
  };

  const clearUserData = () => {
    setUser(null);
    setBranch(null);
    setUserId(null);  // Limpiar el id_usuario
    setBranchId(null);  // Limpiar el id_sucursal
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("id_usuario");
    localStorage.removeItem("id_sucursal");
  };

  return (
    <UserContext.Provider value={{ user, branch, userId, branchId, setUserData, clearUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
