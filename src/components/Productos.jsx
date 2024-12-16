import React, { useEffect, useState, useRef } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  message,
  Spin,
  Typography,
  Row,
  Col,
  Upload,
  Image,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  BarcodeOutlined,
  FileImageOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import axios from "axios";
import API_BASE_URL from "../config/api";
import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf"; // Importa jsPDF

const { Title } = Typography;
const { confirm } = Modal;

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [allProductos, setAllProductos] = useState([]); // Almacena todos los productos para filtrado
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  const [form] = Form.useForm();
  const [codigoGenerado, setCodigoGenerado] = useState("");
  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const barcodeRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [barcodeImage, setBarcodeImage] = useState("");
  const [newCategoria, setNewCategoria] = useState(""); // Estado para nueva categoría
  const [saving, setSaving] = useState(false); // Estado para el loader al guardar

  // Función para obtener productos
  const fetchProductos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/productos`);
      setProductos(response.data);
      setAllProductos(response.data); // Almacenar todos los productos
      const categoriasUnicas = [
        ...new Map(
          response.data
            .filter((producto) => producto.categoria)
            .map((item) => [item.categoria.id, item.categoria])
        ).values(),
      ];
      setCategorias(categoriasUnicas);
    } catch (error) {
      message.error("Error al cargar los productos");
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener proveedores
  const fetchProveedores = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/proveedores`);
      setProveedores(response.data);
    } catch (error) {
      message.error("Error al cargar los proveedores");
    }
  };

  // Función para obtener sucursales
  const fetchSucursales = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sucursales`);
      setSucursales(response.data);
    } catch (error) {
      message.error("Error al cargar las sucursales");
    }
  };

  // useEffect para cargar datos al montar el componente
  useEffect(() => {
    fetchProductos();
    fetchProveedores();
    fetchSucursales();
  }, []);

  // Función para manejar cambios en el campo de búsqueda (búsqueda en tiempo real)
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setCodigoBusqueda(value);
    if (value.trim() === "") {
      setProductos(allProductos); // Mostrar todos los productos si el campo está vacío
    } else {
      const filtered = allProductos.filter((producto) =>
        producto.codigo_barras.toLowerCase().includes(value.toLowerCase())
      );
      setProductos(filtered);
    }
  };

  // Función para generar el código de barras y obtener el dataURL
  const generateBarcode = (codigo_barras) => {
    return new Promise((resolve, reject) => {
      if (!codigo_barras) {
        reject(new Error("Código de barras no proporcionado"));
        return;
      }
      try {
        JsBarcode(barcodeRef.current, codigo_barras, {
          format: "CODE128",
          displayValue: true,
        });
        setTimeout(() => {
          if (barcodeRef.current) {
            const dataURL = barcodeRef.current.toDataURL();
            resolve(dataURL);
          } else {
            reject(new Error("Referencia de barcodeRef no disponible"));
          }
        }, 100);
      } catch (error) {
        reject(error);
      }
    });
  };

  // Función para generar y descargar el PDF de la etiqueta
  const handlePrintLabel = (dataURL, precio) => {
    if (!dataURL) {
      message.warning("No hay código de barras generado para imprimir.");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [70, 70], // Tamaño personalizado: ancho x alto
    });

    // Añadir la imagen del código de barras
    doc.addImage(dataURL, "PNG", 10, 10, 60, 20); // x, y, width, height

    // Añadir el precio
    doc.setFontSize(16);
    doc.text(`Bs. ${precio}`, 40, 40, { align: "center" });

    // Descargar el PDF
    doc.save(`etiqueta_${codigoGenerado}.pdf`);
  };

  // Función para mostrar el modal (crear o editar producto)
  const showModal = (producto = null) => {
    setEditingProducto(producto);
    if (producto) {
      form.setFieldsValue({
        ...producto,
        proveedor_id: producto.proveedor?.id || null,
        categoria_id: producto.categoria?.id || null,
        id_sucursal: producto.sucursal?.id || null, // Cambiar a id_sucursal
      });
      setCodigoGenerado(producto.codigo_barras || "");
      setImageFile(null);
      setImageLoading(true);
      if (producto.codigo_barras) {
        generateBarcode(producto.codigo_barras)
          .then((dataURL) => {
            setBarcodeImage(dataURL);
          })
          .catch((error) => {
            message.error("Error al generar el código de barras.");
            setBarcodeImage("");
          });
      } else {
        setBarcodeImage("");
      }
    } else {
      form.resetFields();
      setCodigoGenerado("");
      setImageFile(null);
      setImageLoading(false);
      setBarcodeImage("");
    }
    setIsModalVisible(true);
  };

  // Función para manejar la cancelación del modal
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingProducto(null);
    setCodigoGenerado("");
    form.resetFields();
    setImageFile(null);
    setImageLoading(false);
    setBarcodeImage("");
    setNewCategoria(""); // Resetear nueva categoría
  };

  // Función para manejar el envío del formulario (crear o editar producto)
  const handleSubmit = async (values) => {
    const formData = new FormData();
    formData.append("nombre", values.nombre);
    formData.append("descripcion", values.descripcion);
    formData.append("costo", values.costo);
    formData.append("precio_venta", values.precio_venta);
    formData.append("stock", values.stock);
    formData.append("proveedor_id", values.proveedor_id); // Cambiado a proveedor_id
    formData.append("codigo_barras", values.codigo_barras);
    formData.append("fecha_caducidad", values.fecha_caducidad);
    formData.append("categoria_id", values.categoria_id);
    formData.append("id_sucursal", values.id_sucursal); // Cambiado a id_sucursal
    if (imageFile) {
      formData.append("imagen", imageFile);
    }

    try {
      setSaving(true); // Iniciar el loader
      if (editingProducto) {
        await axios.put(`${API_BASE_URL}/productos/${editingProducto.id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        message.success("Producto actualizado exitosamente");
      } else {
        await axios.post(`${API_BASE_URL}/productos`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        message.success("Producto creado exitosamente");
      }
      fetchProductos();
      handleCancel();
    } catch (error) {
      if (error.response && error.response.data) {
        message.error(error.response.data.message || "Error al guardar el producto");
      } else {
        message.error("Error desconocido al guardar el producto");
      }
    } finally {
      setSaving(false); // Detener el loader
    }
  };

  // Función para eliminar un producto
  const handleDelete = (id) => {
    confirm({
      title: "¿Estás seguro de eliminar este producto?",
      icon: <ExclamationCircleOutlined />,
      content: "Esta acción no se puede deshacer.",
      okText: "Sí, eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/productos/${id}`);
          message.success("Producto eliminado correctamente");
          fetchProductos();
        } catch (error) {
          message.error("Error al eliminar el producto");
        }
      },
    });
  };

  // Función para manejar cambios en el código de barras
  const handleBarcodeChange = (e) => {
    const barcodeValue = e.target.value;
    setCodigoGenerado(barcodeValue);
    if (barcodeValue) {
      generateBarcode(barcodeValue)
        .then((dataURL) => {
          setBarcodeImage(dataURL);
        })
        .catch((error) => {
          message.error("Error al generar el código de barras.");
          setBarcodeImage("");
        });
    } else {
      setBarcodeImage("");
    }
  };

  // Función para agregar una nueva categoría
  const handleAddCategoria = async () => {
    const value = newCategoria.trim();
    if (!value) {
      message.error("Nombre de categoría inválido.");
      return;
    }

    const existe = categorias.find(
      (cat) => cat.nombre && cat.nombre.toLowerCase() === value.toLowerCase()
    );
    if (existe) {
      form.setFieldsValue({ categoria_id: existe.id });
      message.info("La categoría ya existe.");
      setNewCategoria(""); // Resetear el input
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/categorias`, { nombre: value });
      message.success("Categoría añadida exitosamente");
      setCategorias([...categorias, response.data]);
      form.setFieldsValue({ categoria_id: response.data.id });
      setNewCategoria(""); // Resetear el input
    } catch (error) {
      message.error("Error al agregar la categoría");
    }
  };

  // Definición de las columnas de la tabla
  const columns = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
    },
    {
      title: "Código de Barras",
      dataIndex: "codigo_barras",
      key: "codigo_barras",
      render: (codigo_barras) => codigo_barras || "N/A",
    },
    {
      title: "Categoría",
      dataIndex: "categoria",
      key: "categoria",
      render: (text, record) => <span>{record.categoria?.nombre || "No asignada"}</span>,
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      render: (stock) => (
        <Tag color={stock > 10 ? "green" : stock > 0 ? "orange" : "red"}>{stock}</Tag>
      ),
    },
    {
      title: "Precio de Venta",
      dataIndex: "precio_venta",
      key: "precio_venta",
      render: (precio) => `Bs. ${precio}`,
    },
    {
      title: "Imagen",
      dataIndex: "imagen",
      key: "imagen",
      render: (imagen) =>
        imagen ? <Image src={`${API_BASE_URL}${imagen}`} width={50} /> : "N/A",
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
          <Button
            type="link"
            icon={<BarcodeOutlined />}
            onClick={async () => {
              if (record.codigo_barras) {
                try {
                  const dataURL = await generateBarcode(record.codigo_barras);
                  handlePrintLabel(dataURL, record.precio_venta);
                } catch (error) {
                  message.error(error.message || "Error al generar el código de barras.");
                }
              } else {
                message.error("El producto no tiene un código de barras válido.");
              }
            }}
          >
            Imprimir Código
          </Button>
        </>
      ),
    },
  ];

  return (
    <div>
      {/* Encabezado con título, búsqueda y botón de nuevo producto */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Title level={2}>Productos</Title>
        </Col>
        <Col span={8}>
          <Input
            placeholder="Buscar por código de barras"
            value={codigoBusqueda}
            onChange={handleSearchChange}
            style={{ width: "100%" }}
          />
        </Col>
        <Col span={8} style={{ textAlign: "right" }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            Nuevo Producto
          </Button>
        </Col>
      </Row>

      {/* Tabla de productos */}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={productos}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ y: 400 }}
        />
      </Spin>

      {/* Modal para crear o editar producto */}
      <Modal
        title={editingProducto ? "Editar Producto" : "Nuevo Producto"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={1000}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {/* Primera fila de campos */}
          <Row gutter={16}>
            <Col span={4}>
              <Form.Item
                label="Nombre"
                name="nombre"
                rules={[{ required: true, message: "Por favor ingresa el nombre" }]}
              >
                <Input prefix={<EditOutlined />} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label="Proveedor"
                name="proveedor_id"
                rules={[{ required: true, message: "Selecciona un proveedor" }]}
              >
                <Select
                  placeholder="Selecciona un proveedor"
                  allowClear
                >
                  {proveedores.map((prov) => (
                    <Select.Option key={prov.id} value={prov.id}>
                      {prov.nombre}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label="Costo"
                name="costo"
                rules={[{ required: true, message: "Por favor ingresa el costo" }]}
              >
                <Input prefix={<EditOutlined />} type="number" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label="Precio de Venta"
                name="precio_venta"
                rules={[{ required: true, message: "Por favor ingresa el precio de venta" }]}
              >
                <Input prefix={<EditOutlined />} type="number" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label="Stock"
                name="stock"
                rules={[{ required: true, message: "Por favor ingresa el stock" }]}
              >
                <Input prefix={<EditOutlined />} type="number" />
              </Form.Item>
            </Col>
          </Row>

          {/* Segunda fila de campos: Descripción, Sucursal y Categoría */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="Descripción"
                name="descripcion"
                rules={[{ required: true, message: "Por favor ingresa la descripción" }]}
              >
                <Input.TextArea prefix={<EditOutlined />} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Sucursal"
                name="id_sucursal"
                rules={[{ required: true, message: "Por favor selecciona una sucursal" }]}
              >
                <Select placeholder="Seleccionar Sucursal">
                  {sucursales.map((sucursal) => (
                    <Select.Option key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Categoría"
                name="categoria_id"
                rules={[{ required: true, message: "Selecciona una categoría" }]}
              >
                <Select
                  placeholder="Selecciona una categoría"
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <div style={{ display: "flex", flexWrap: "nowrap", padding: 8 }}>
                        <Input
                          style={{ flex: "auto" }}
                          placeholder="Agregar nueva categoría"
                          value={newCategoria}
                          onChange={(e) => setNewCategoria(e.target.value)}
                          onPressEnter={handleAddCategoria}
                        />
                        <Button
                          type="link"
                          onClick={handleAddCategoria}
                        >
                          <PlusOutlined /> Agregar
                        </Button>
                      </div>
                    </>
                  )}
                  onChange={() => setNewCategoria("")}
                >
                  {categorias.map((categoria) => (
                    <Select.Option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Código de Barras"
                name="codigo_barras"
                rules={[{ required: true, message: "Por favor ingresa el código de barras" }]}
              >
                <Input
                  value={codigoGenerado}
                  onChange={handleBarcodeChange}
                  prefix={<BarcodeOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Tercera fila de campos: Fecha de Caducidad e Imagen */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={5}>
              <Form.Item
                label="Fecha de Caducidad"
                name="fecha_caducidad"
                rules={[{ required: true, message: "Por favor ingresa la fecha de caducidad" }]}
              >
                <Input type="date" prefix={<EditOutlined />} />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item
                label="Imagen"
                name="imagen"
                rules={[{ required: false }]}
              >
                <Upload
                  beforeUpload={(file) => {
                    setImageFile(file);
                    return false;
                  }}
                  fileList={imageFile ? [imageFile] : []}
                  showUploadList={false}
                >
                  <Button icon={<FileImageOutlined />}>Subir Imagen</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={5}>
              {imageFile && (
                <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}>
                  <Image src={URL.createObjectURL(imageFile)} width={150} />
                </div>
              )}
            </Col>
            <Col span={5}>
              <div style={{ textAlign: "center" }}>
                {/* Canvas para generar el código de barras, oculto */}
                <canvas ref={barcodeRef} style={{ display: "none" }}></canvas>
                {/* Imagen del código de barras generado */}
                {barcodeImage && (
                  <Image src={barcodeImage} width={150} />
                )}
                <Button
                  type="primary"
                  icon={<BarcodeOutlined />}
                  style={{ marginTop: "10px" }}
                  onClick={async () => {
                    if (codigoGenerado) {
                      try {
                        const dataURL = await generateBarcode(codigoGenerado);
                        handlePrintLabel(dataURL, form.getFieldValue("precio_venta") || "0.00");
                      } catch (error) {
                        message.error(error.message || "Error al generar el código de barras.");
                      }
                    } else {
                      message.error("No hay código de barras para imprimir.");
                    }
                  }}
                >
                  Imprimir Código de Barras
                </Button>
              </div>
            </Col>
          </Row>

          {/* Fila de botones */}
          <Row gutter={16} style={{ marginTop: 20 }}>
            <Col span={12}>
              <Button
                type="default"
                style={{ width: "100%" }}
                icon={<ExclamationCircleOutlined />}
                onClick={handleCancel}
              >
                Cancelar
              </Button>
            </Col>
            <Col span={12}>
              <Button
                type="primary"
                htmlType="submit"
                style={{ width: "100%" }}
                icon={<SaveOutlined />}
                loading={saving} // Muestra el loader cuando saving es true
              >
                Guardar
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Productos;
