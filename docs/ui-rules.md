# 🎨 UI Design System

Sos un desarrollador frontend senior y diseñador UI.

DEBÉS seguir este design system estrictamente al construir la UI.

Este sistema está basado en un estilo de dashboard moderno con sombras suaves,
contenedores redondeados y un layout limpio y minimal.

---

# 🎨 DESIGN SYSTEM

## 🔵 Color Primario

- Azul: #1479FF

Usos:
- Botones primarios
- Elementos activos
- Highlights

---

## 🎨 Colores Secundarios

- Azul oscuro (texto): #193B68
- Fondo gris claro: #F5F7FB
- Blanco: #FFFFFF

---

## ✨ Colores Accent

- #14D2FF
- #14A5FF
- #14EBFF

Solo para highlights sutiles. NO para elementos principales de UI.

---

## 🚦 Colores Semánticos

- Error / destructivo: rojo suave → `#FEE2E2` fondo, `#DC2626` texto
- Éxito / valor: verde suave → `#DCFCE7` fondo, `#16A34A` texto
- Rol admin: azul suave → `bg-blue-50` fondo, `#1479FF` texto
- Etiquetas: punto con el color propio de la etiqueta sobre fondo gris claro

---

# 🧱 REGLAS DE COMPONENTES UI

## 📦 Contenedores (Cards)

- Fondo: blanco
- Border radius: 24px o 40px
- Sombra suave:
  - blur: 30px–50px
  - opacidad baja
- Padding generoso: 16px–24px

---

## 🔘 Botones

### Primario
- Fondo: #1479FF
- Texto: blanco
- Border radius: 12px–16px
- Sombra azul suave
- Hover: levemente más oscuro

### Secundario
- Fondo: gris claro
- Texto: azul oscuro
- Sin sombra pesada

### Outline
- Border: 2px solid #1479FF
- Fondo: transparente

### Peligro (destructivo)
- Fondo: #DC2626
- Texto: blanco

---

## 🏷️ Badges / Tags

Usar para indicar estados, roles y etiquetas:

- Fondo de color suave (10-15% opacidad)
- Texto del color semántico correspondiente
- Border radius redondeado (full)
- Padding pequeño: 2px 8px

---

## 🔧 Contenedores de Íconos

- Cuadrado con esquinas redondeadas (24px–32px radius)
- Fondo azul O azul claro (10% opacidad)
- Ícono centrado

---

# 🔤 TIPOGRAFÍA

- Usar sans-serif limpio (Inter preferido)
- Títulos: bold
- Color de texto: #193B68
- Texto secundario: opacidad menor

---

# 📏 ESPACIADO

Usar escala consistente:
- 8px / 12px / 16px / 24px / 32px

- Evitar layouts apretados
- Preferir espacio en blanco

---

# 🧩 ESTRUCTURA DE LAYOUT

La app debe seguir un layout de dashboard:

- Sidebar izquierdo
- Header superior
- Área de contenido principal

---

## 📌 Sidebar

- Vertical
- Íconos + labels
- Item activo resaltado en azul
- Contenedores de ícono redondeados

---

## 📊 Área de Contenido

- Layout de cards
- Secciones visualmente separadas
- Limpio y minimal

---

# 📱 RESPONSIVENESS

- Mobile-first
- Sidebar colapsa en mobile (hamburger o bottom nav)
- Cards se apilan verticalmente
- Tablas con scroll horizontal en mobile

---

# 🎯 PRINCIPIOS UX

- Mínima cantidad de clicks
- Jerarquía visual clara
- Acciones importantes siempre visibles
- Interacción rápida
- Sin `alert()` del browser — usar mensajes inline o toast components

---

# ⚠️ REGLAS CRÍTICAS

- NO usar colores al azar
- NO usar sombras duras
- NO usar bordes rectos (siempre redondeados)
- NO complicar el layout
- SIEMPRE seguir este design system
- NO mezclar estilos distintos entre páginas

---

# 🧠 REGLAS DE IMPLEMENTACIÓN (Vue + Tailwind)

- Usar solo Tailwind CSS
- Preferir utility classes
- Extraer componentes reutilizables (en `components/ui/`):
  - AppModal      → modales de formulario y confirmación
  - PageHeader    → cabecera de cada vista con título y acción principal
  - LabelBadge    → etiqueta con su color
  - SkeletonBlock → placeholders de carga

---

# 🎯 OBJETIVO

Construir una UI de dashboard profesional
que se vea limpia, moderna y consistente
en toda la aplicación.
