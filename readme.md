# 📚 Biblioteca Aurora POO II

**Una biblioteca inteligente que conecta lectura, inteligencia artificial y realidad virtual.**

Biblioteca Aurora es un proyecto de desarrollo de software orientado a modernizar la experiencia de una biblioteca mediante una interfaz dinámica, herramientas de gestión bibliotecaria y experiencias tecnológicas interactivas. Su propósito es ofrecer un entorno donde los usuarios puedan explorar libros, gestionar su información, consultar su historial de préstamos y descubrir nuevas lecturas mediante recomendaciones personalizadas.

El proyecto integra tecnologías web, procesamiento mediante Python, almacenamiento de información con PostgreSQL, inteligencia artificial local y visualización de entornos tridimensionales con realidad virtual.

---

## ✨ Características principales

### 🏠 1. Experiencia de navegación moderna
- Página de inicio con una presentación visual de la biblioteca.
- Catálogo para explorar los libros disponibles.
- Interfaces con animaciones modernas y transiciones visuales.
- Iconografía SVG y Font Awesome.
- Alertas e interacciones mediante SweetAlert.
- Diseño orientado a una experiencia de usuario intuitiva y agradable.

### 🔐 2. Autenticación y registro
- Interfaz para iniciar sesión.
- Formulario de registro de usuarios.
- Acceso a espacios personalizados según el tipo de usuario.
- Separación de las experiencias de usuario y administrador.

### 👤 3. Panel de usuario
Un espacio personal desde el cual el lector puede consultar y gestionar su información.

- Visualización de sus datos personales.
- Actualización de la información de su perfil.
- Consulta del historial de libros prestados.
- Acceso a recomendaciones de lectura personalizadas.
- Experiencia de exploración de libros mediante realidad virtual.

### 🛠️ 4. Panel de administración
Un entorno destinado a la gestión y supervisión de la biblioteca.

- Panel de control administrativo.
- Consulta y actualización de información personal.
- Acceso a la vista general del catálogo de libros.
- Exploración de los libros mediante un entorno tridimensional.
- Herramientas de visualización y seguimiento de la información bibliotecaria, según las funcionalidades integradas.

### 🤖 5. Inteligencia artificial local
Biblioteca Aurora contempla un asistente inteligente desarrollado con Python, orientado a trabajar con información de la propia biblioteca.

El objetivo es aprovechar los datos disponibles para ofrecer una experiencia más personalizada, teniendo en cuenta aspectos como:

- La información del usuario.
- Su historial de lectura y de libros prestados.
- Los libros registrados en la base de datos.
- Las posibles afinidades entre los intereses del lector y el catálogo.

Esta integración busca facilitar el descubrimiento de nuevas lecturas y generar recomendaciones relevantes a partir de la información disponible en el sistema.

### 🥽 6. Experiencia de realidad virtual
Mediante A-Frame, el proyecto incorpora un entorno tridimensional e inmersivo para explorar libros recomendados o consultar el catálogo general, dependiendo del perfil de acceso.

- **Usuarios:** exploración visual de libros recomendados.
- **Administradores:** exploración general de los libros de la biblioteca.
- Entorno interactivo basado en tecnologías web 3D.

### 💬 7. PQRS
Un espacio destinado a las peticiones, quejas, reclamos y sugerencias de los usuarios, con el propósito de facilitar la comunicación con la biblioteca.

---

## 🧰 Tecnologías utilizadas

| Tecnología | Propósito |
|---|---|
| HTML5 | Estructura de las páginas web. |
| CSS3 | Estilos, animaciones y diseño visual. |
| JavaScript | Interactividad y comportamiento del frontend. |
| Python | Desarrollo de componentes del backend y del asistente inteligente. |
| PostgreSQL | Gestión y almacenamiento de datos. |
| Font Awesome | Iconografía de la interfaz. |
| SweetAlert | Alertas y ventanas interactivas. |
| Dschart | Visualización de información mediante gráficos, según la integración del proyecto. |
| SVG | Iconos y recursos gráficos vectoriales. |
| A-Frame | Construcción de experiencias 3D y realidad virtual. |

La arquitectura puede incorporar otras bibliotecas y herramientas complementarias a medida que evolucione el proyecto.

---

## 📁 Estructura del proyecto

La estructura inicial del frontend publicado en este repositorio es la siguiente:

```text
BIBLIOTECA-AURORA-POO2/
│
├── css/
│   ├── catalogo.css
│   ├── index.css
│   ├── login.css
│   ├── pqrs.css
│   └── registro.css
│
├── html/
│   ├── catalogo.html
│   ├── login.html
│   ├── pqrs.html
│   └── registro.html
│
├── iconos/
│   └── favicon.svg
│
├── js/
│   ├── index.js
│   ├── login.js
│   └── nav.js
│
├── .gitignore
├── index.html
└── README.md
```

> Esta estructura corresponde a la versión inicial del frontend. Los archivos adicionales del backend, la configuración de PostgreSQL, el asistente inteligente y el entorno 3D se documentarán conforme se incorporen a la estructura definitiva del repositorio.

---

## 🚀 Cómo ejecutar el frontend

### Requisitos

- Un navegador web moderno.
- Git, si deseas clonar el repositorio.
- Visual Studio Code y la extensión Live Server, recomendados para el desarrollo local.

### 1. Clonar el repositorio

```bash
git clone https://github.com/juanjose0624/BIBLIOTECA-AURORA-POO2.git
```

### 2. Entrar en la carpeta del proyecto

```bash
cd BIBLIOTECA-AURORA-POO2
```

### 3. Abrir el proyecto

Abre la carpeta en Visual Studio Code y ejecuta `index.html` con Live Server.

También puedes abrir `index.html` directamente en tu navegador, aunque un servidor local suele ser más conveniente para el desarrollo web.

**Nota:** la ejecución completa de los componentes Python, PostgreSQL e inteligencia artificial requerirá sus respectivas configuraciones y dependencias cuando estén integrados en el repositorio.

---

## 🎯 Objetivos del proyecto

- Modernizar la experiencia tradicional de una biblioteca.
- Facilitar el acceso y la consulta de información bibliográfica.
- Diferenciar las funcionalidades disponibles para lectores y administradores.
- Incorporar inteligencia artificial para apoyar el descubrimiento de lecturas.
- Explorar nuevas formas de interacción mediante realidad virtual.
- Aplicar principios de desarrollo de software, organización modular y evolución progresiva de una aplicación.

---

## 🔮 Visión del proyecto

Biblioteca Aurora busca evolucionar hacia una plataforma bibliotecaria integral que combine la organización tradicional del conocimiento con las posibilidades de las tecnologías actuales.

La propuesta une la lectura y la gestión bibliotecaria con herramientas inteligentes y experiencias inmersivas, manteniendo como objetivo central facilitar el acceso a los libros y mejorar la experiencia de cada usuario.

---

## 📌 Estado del proyecto

**En desarrollo.**

Este repositorio corresponde a la evolución de Biblioteca Aurora en el marco de Programación Orientada a Objetos II (POO II). Sus funcionalidades, arquitectura y tecnologías continuarán evolucionando durante el desarrollo académico.

---

## 👨‍💻 Autor

**Juan José**

Estudiante de Ingeniería Informática y desarrollador del proyecto.

GitHub: [@juanjose0624](https://github.com/juanjose0624)

---

*Biblioteca Aurora POO II — La lectura evoluciona con la tecnología.* 📚
