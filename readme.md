# 📚 Biblioteca Aurora POO II

**Una biblioteca inteligente que conecta lectura, gestión bibliotecaria y realidad virtual.**

Biblioteca Aurora es una aplicación web desarrollada en el marco de Programación Orientada a Objetos II (POO II). Su propósito es modernizar la experiencia de una biblioteca mediante una plataforma que integra la consulta de libros, la gestión de usuarios, las solicitudes y los préstamos bibliotecarios, la administración de PQRS y experiencias interactivas.

El proyecto utiliza una arquitectura modular basada en **Python y Flask**, con **PostgreSQL** como sistema de gestión de bases de datos y tecnologías web para construir una interfaz moderna. También incorpora experiencias tridimensionales mediante **Babylon.js**, que permiten explorar el catálogo bibliográfico en un entorno interactivo.

---

## ✨ Características principales

### 🏠 1. Interfaz web moderna

- Página de inicio con la identidad visual de Biblioteca Aurora.
- Catálogo para explorar los libros disponibles.
- Formularios de inicio de sesión y registro.
- Interfaces organizadas para facilitar la navegación.
- Iconografía SVG y Font Awesome.
- Alertas e interacciones mediante SweetAlert2.
- Diseño con animaciones, transiciones y elementos visuales modernos.

### 🔐 2. Autenticación y control de acceso

- Inicio de sesión y registro de usuarios.
- Gestión de sesiones mediante Flask.
- Acceso diferenciado para usuarios y administradores.
- Protección de rutas según la sesión y el rol.
- Almacenamiento seguro de contraseñas mediante hashes con bcrypt.
- Validación de credenciales y datos de entrada.

### 👤 3. Panel de usuario

Un espacio personal que reúne las funcionalidades disponibles para los lectores.

- Consulta y actualización de datos personales.
- Exploración del catálogo bibliográfico.
- Consulta de solicitudes y préstamos.
- Seguimiento del historial de libros prestados.
- Acceso a funcionalidades de exploración interactiva integradas en el proyecto.
- Consulta del progreso y la clasificación de lectores, según las funcionalidades habilitadas.

### 🛠️ 4. Panel de administración

Un entorno destinado a gestionar y supervisar las operaciones de la biblioteca.

- Administración de usuarios.
- Gestión del catálogo de libros.
- Consulta y gestión de PQRS.
- Revisión de solicitudes de préstamo.
- Aprobación y rechazo de solicitudes.
- Registro de devoluciones.
- Gestión de sanciones asociadas a los préstamos.
- Consulta de información y estadísticas disponibles en el sistema.
- Exploración general del catálogo mediante un entorno tridimensional.

### 📚 5. Gestión de libros

El catálogo constituye uno de los componentes centrales de Biblioteca Aurora.

- Registro de información bibliográfica.
- Consulta y búsqueda de libros.
- Actualización de datos bibliográficos.
- Eliminación de registros según las validaciones del sistema.
- Gestión de cantidades totales y disponibles.
- Persistencia de la información en PostgreSQL.

### 🔄 6. Solicitudes, préstamos y sanciones

El sistema contempla un flujo bibliotecario que diferencia las solicitudes de los préstamos aprobados.

- Consulta de solicitudes y préstamos.
- Aprobación o rechazo de solicitudes.
- Registro de devoluciones.
- Seguimiento de las fechas relacionadas con los préstamos.
- Gestión de sanciones.
- Validación de operaciones para preservar la integridad de los registros.

### 👥 7. Tabla de posiciones

Biblioteca Aurora incorpora una clasificación orientada a visualizar la participación de los lectores.

- Consulta de puntos acumulados.
- Seguimiento de libros leídos.
- Organización de los resultados según la puntuación.
- Visualización del nivel de lectura de cada usuario.

Esta funcionalidad busca incentivar la participación y convertir la lectura en una experiencia más interactiva.

### 💬 8. PQRS

El módulo de peticiones, quejas, reclamos y sugerencias facilita la comunicación entre los usuarios y la administración de la biblioteca.

- Registro de solicitudes de los usuarios.
- Consulta de las PQRS existentes.
- Actualización de la información y del estado de las solicitudes.
- Gestión de respuestas administrativas.
- Eliminación de registros mediante las operaciones autorizadas.

### 🥽 9. Exploración tridimensional y realidad virtual

El proyecto incorpora experiencias de exploración de libros mediante **Babylon.js**, un motor de renderizado 3D para aplicaciones web interactivas.

- Exploración visual del catálogo en un entorno tridimensional.
- Presentación interactiva de libros.
- Experiencias orientadas a los lectores y a la administración.
- Exploración de libros recomendados para los usuarios, según las funcionalidades integradas.
- Visualización general del catálogo para los administradores.

La experiencia utiliza tecnologías web 3D para ofrecer una forma alternativa de descubrir y visualizar los libros de la biblioteca.

---

## 🧰 Tecnologías utilizadas

| Tecnología | Propósito |
| --- | --- |
| HTML5 | Estructura de las páginas web. |
| CSS3 | Diseño visual, estilos, animaciones y transiciones. |
| JavaScript | Interactividad y comunicación con la API. |
| Python | Desarrollo de la lógica del backend. |
| Flask | Framework para desarrollar la aplicación web y sus rutas. |
| PostgreSQL | Almacenamiento y gestión de datos relacionales. |
| Psycopg | Conexión y comunicación entre Python y PostgreSQL. |
| bcrypt | Protección de contraseñas mediante hashes. |
| SweetAlert2 | Alertas, confirmaciones y ventanas interactivas. |
| Font Awesome | Iconografía de la interfaz. |
| SVG | Recursos gráficos vectoriales. |
| Babylon.js | Renderizado 3D y experiencias interactivas en la web. |
| Git y GitHub | Control de versiones y alojamiento del repositorio. |

El proyecto puede utilizar bibliotecas adicionales según los componentes y las funcionalidades incorporados.

---

## 🏗️ Arquitectura del proyecto

Biblioteca Aurora organiza el backend en módulos con responsabilidades diferenciadas. Esta separación facilita el mantenimiento, las pruebas y la evolución de la aplicación.

- **Rutas:** reciben las solicitudes HTTP, aplican los controles de acceso y devuelven las respuestas.
- **Servicios:** centralizan las reglas de negocio y las validaciones.
- **Repositorios:** encapsulan las operaciones de acceso a PostgreSQL.
- **Modelos:** organizan las estructuras de datos del dominio.
- **Configuración:** centraliza los parámetros de la aplicación y la conexión a la base de datos.
- **Frontend:** contiene las páginas, los estilos, los scripts y las interfaces de gestión.

La aplicación utiliza una factoría de Flask para centralizar su creación y registrar los módulos de rutas.

### Estructura general

```text
BIBLIOTECA-AURORA-POO2/
│
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── db.py
│   ├── modelos/
│   ├── repositorios/
│   ├── rutas/
│   ├── servicios/
│   └── requirements.txt
│
├── css/
├── html/
├── js/
├── iconos/
├── cruds/
│   ├── js/
│   └── ...
├── dashboards/
│   ├── administrador.html
│   ├── usuario.html
│   ├── actualizar_datos.html
│   ├── tabla_posiciones.html
│   └── vr.html
│
├── index.html
├── .gitignore
└── README.md
```

*La estructura es orientativa y resume los principales componentes del proyecto. Los archivos concretos pueden variar a medida que evoluciona el repositorio.*

---

## 🗄️ Base de datos

Biblioteca Aurora utiliza **PostgreSQL** para almacenar la información bibliotecaria y los datos necesarios para el funcionamiento de la aplicación.

| Entidad | Responsabilidad |
| --- | --- |
| `usuarios` | Información de las cuentas, datos personales y roles. |
| `libros` | Datos bibliográficos y disponibilidad de ejemplares. |
| `prestamos` | Información relacionada con los préstamos y su seguimiento. |
| `pqrs` | Peticiones, quejas, reclamos y sugerencias. |
| Solicitudes de préstamo | Registro y seguimiento de las solicitudes de los usuarios. |
| Sanciones | Registro de sanciones asociadas a las reglas de préstamo. |
| Historial de puntos | Información utilizada para el seguimiento y la clasificación de lectores. |

Los nombres y las relaciones concretas de las tablas deben corresponder al esquema de PostgreSQL configurado en la versión actual del proyecto.

---

## 🚀 Instalación y ejecución

### Requisitos previos

Antes de ejecutar la aplicación, asegúrate de tener instalado:

- Python compatible con las dependencias del proyecto.
- PostgreSQL.
- Git, para clonar el repositorio.
- Visual Studio Code u otro editor de código.
- Un navegador web moderno.

### 1. Clonar el repositorio

```bash
git clone https://github.com/juanjose0624/BIBLIOTECA-AURORA-POO2.git
```

### 2. Entrar en el proyecto

```bash
cd BIBLIOTECA-AURORA-POO2
```

### 3. Crear un entorno virtual

Desde la raíz del proyecto, crea y activa un entorno virtual.

En Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 4. Instalar las dependencias

```powershell
python -m pip install -r backend/requirements.txt
```

### 5. Configurar las variables de entorno

Configura las variables requeridas por `backend/config.py` en un archivo `.env`, utilizando los nombres definidos por la configuración actual.

Incluye los parámetros necesarios para:

- La conexión a PostgreSQL.
- La clave secreta de Flask.
- La seguridad y duración de las sesiones.

No publiques contraseñas, claves secretas ni credenciales reales en el repositorio.

### 6. Preparar PostgreSQL

Crea la base de datos configurada para el proyecto y asegúrate de que las tablas y los datos iniciales estén disponibles.

Si el repositorio incluye scripts SQL de creación o inicialización, ejecútalos siguiendo el orden establecido por sus dependencias.

### 7. Ejecutar la aplicación

Desde la raíz del proyecto, inicia la aplicación:

```powershell
python backend/app.py
```

Si el punto de entrada está preparado únicamente para ser importado, utiliza el comando de ejecución definido por la configuración vigente de Flask.

Abre en el navegador la dirección local que muestre Flask al iniciar.

> **Importante:** la aplicación completa requiere una configuración funcional de PostgreSQL, las variables de entorno y las dependencias del backend. Abrir `index.html` directamente no sustituye la ejecución de Flask cuando se necesitan autenticación, operaciones CRUD y comunicación con la base de datos.

---

## 🔒 Consideraciones de seguridad

Biblioteca Aurora incorpora mecanismos orientados a proteger los datos y controlar el acceso a las funcionalidades.

- Contraseñas almacenadas mediante hashes con bcrypt.
- Validaciones de datos en los servicios y las rutas.
- Control de acceso basado en sesiones y roles.
- Protección de rutas administrativas.
- Configuración centralizada de parámetros sensibles.
- Acceso a PostgreSQL mediante un módulo de conexión.
- Validación de operaciones que afectan a usuarios, préstamos y registros relacionados.

La seguridad final depende también de la configuración del entorno de ejecución, la gestión de credenciales, las restricciones de PostgreSQL y las validaciones de cada operación.

---

## 🎯 Objetivos del proyecto

- Modernizar la experiencia de una biblioteca tradicional.
- Facilitar la consulta y administración de información bibliográfica.
- Aplicar principios de programación orientada a objetos y modularidad.
- Separar la lógica de presentación, las reglas de negocio y el acceso a datos.
- Implementar autenticación y control de acceso según los roles.
- Gestionar solicitudes, préstamos, devoluciones, sanciones y PQRS.
- Incorporar experiencias interactivas mediante tecnologías tridimensionales.
- Fortalecer las buenas prácticas de desarrollo, seguridad y mantenimiento del software.

---

## 🔮 Visión del proyecto

Biblioteca Aurora busca evolucionar hacia una plataforma bibliotecaria integral que conecte la organización del conocimiento con las posibilidades de las tecnologías actuales.

Su propuesta combina una gestión bibliotecaria estructurada con herramientas digitales y experiencias inmersivas mediante Babylon.js. La visión es facilitar el acceso a los libros, mejorar los procesos administrativos y ofrecer a cada lector una experiencia más atractiva.

---

## 📌 Estado del proyecto

**En desarrollo.**

Biblioteca Aurora corresponde a la evolución del proyecto académico en el marco de Programación Orientada a Objetos II (POO II). Su arquitectura, sus módulos y sus funcionalidades continúan evolucionando mediante la integración progresiva de componentes y mejoras.
número de lineas de código: 27,036.

---

## 👨‍💻 Autor

### Juan José

Estudiante de Ingeniería Informática y desarrollador del proyecto.

GitHub: [@juanjose0624](https://github.com/juanjose0624)

---

*Biblioteca Aurora POO II — La lectura evoluciona con la tecnología.* 📚
