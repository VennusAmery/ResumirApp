# Expediente de Clase — ResumirApp

> Convierte transcripciones de clases extensas en guías de estudio formateadas y listas para exportar a PDF en segundos.

🔗 **Link funcional:** https://resumir-app-me8r.vercel.app/ 

![Status](https://img.shields.io/badge/Status-Publicado-success?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![NodeJS](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=nodedotjs)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-2.5_Flash-8E7CC3?style=for-the-badge&logo=googlegemini)

---

## Acerca del Proyecto

**Expediente de Clase** es una herramienta web full-stack diseñada para procesar archivos de texto (`.txt`) resultantes de transcripciones automáticas o manuales de clases. La aplicación analiza el contenido con el modelo de IA **Gemini 2.5 Flash**, estructurando los temas principales, artículos, explicaciones clave y anotaciones en un formato visualmente distinguido similar al de un expediente oficial, listo para ser descargado en **PDF**.

---

## Características Principales

* 📄 **Carga interactiva de archivos:** Interfaz intuitiva con soporte para arrastrar y soltar (*drag & drop*) archivos `.txt`.
* 📜 **Diseño Editorial & PDF Personalizado:** Generación directa desde el navegador de documentos PDF con estética de pergamino, sangrías tipográficas y metadatos de expediente usando `jsPDF`.

---

## Tecnologías Utilizadas

### **Frontend**
* **React 18** (Vite)
* **jsPDF** (Generación e impresión de documentos cliente)
* **CSS Module / Custom Properties** (Estilos temáticos personalizados)

### **Backend**
* **Node.js** con **Express**
* **@google/genai** (SDK Oficial v2.13.0)
* **CORS** & **Dotenv**

---

## Instalación y Configuración Local

### Prerrequisitos
* Node.js (v18 o superior)
* Administrador de paquetes `pnpm` 
* Una API Key de **[Google AI Studio](https://aistudio.google.com/)**

### 1. Clonar el repositorio
```bash
git clone https://github.com/VennusAmery/ResumirApp.git

cd ResumirApp
