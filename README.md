# Grupo de Elementos para Documentos de Hipertexto

Una biblioteca ligera para organizar elementos HTML y estilos CSS con **aislamiento automático**, sin las complejidades de los moldes modernos.

## ⚠️ Filosofía del Proyecto (Importante)

**ESTO NO ES UN MOLDE DE APLICACIONES**

Este proyecto no intenta ser React, Vue, Svelte, Solid ni Angular. No busca reemplazarlos ni imitarlos.

La filosofía aquí es diferente:
*   **HTML y CSS son ciudadanos de primera clase:** No los ocultamos. No los "abstraemos" innecesariamente. Los usamos tal como fueron diseñados.
*   **Sin Virtual DOM:** Trabajas directamente con el DOM real (`HTMLElement`). Lo que creas es lo que hay en el navegador.
*   **Sin "Magia" de Compilación:** No necesitas Webpack, Vite, Babel ni herramientas de construcción complejas para que funcione. Es JavaScript estándar (ES Modules).
*   **Sin Gestión de Estado Compleja:** El estado está en el DOM o donde tú decidas ponerlo, no atrapado en un sistema de reactividad propietario.

Es simplemente una **forma diferente de abordar el CSS y HTML**: te ayuda a agrupar elementos y aislar sus estilos para evitar conflictos, pero te deja la libertad de usar la plataforma web tal cual es.

## ¿Por qué usar esto?

El problema clásico del desarrollo web es el **alcance global del CSS**. Tradicionalmente, para solucionar esto, hemos recurrido a:
1.  Convenciones de nombres largas y tediosas (BEM: `.bloque__elemento--modificador`).
2.  Herramientas de construcción pesadas (CSS Modules, Styled Components).
3.  Moldes que secuestran el control del DOM.

**Grupo de Elementos** soluciona esto de forma nativa:
*   Genera un identificador único (UUID) para cada grupo.
*   Aplica automáticamente selectores de atributos (`[data-identificador-del-grupo="..."]`) a tus estilos.
*   Te devuelve elementos DOM reales para que los uses como quieras.

## Instalación

```bash
bun add github:lovedder1995/grupo-de-elementos-para-documentos-de-hipertexto#{última.fecha.de.publicación}
```

## Uso Básico

### 1. Crear un Grupo y Elementos

```javascript
import crear_grupo from "grupo-de-elementos-para-documentos-de-hipertexto";

// 1. Iniciamos un nuevo grupo aislado
const mi_componente = crear_grupo();

// 2. Definimos estilos (Solo afectarán a este grupo)
mi_componente.estilos({
    reglas: {
        ".boton": {
            backgroundColor: "blue",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
        },
        ".boton:hover": {
            backgroundColor: "darkblue"
        }
    }
});

// 3. Creamos elementos
const botón = mi_componente.elemento({
    tagName: "button",
    className: "boton", // O "classList": ["boton"]
    textContent: "¡Hacer Clic!",
    onclick: () => alert("¡Hola mundo nativo!")
});

// 4. Los usamos en el DOM real
document.body.appendChild(botón);
```

### 2. Anidamiento y Composición

Como los elementos devueltos son nodos DOM estándar, puedes anidarlos fácilmente:

```javascript
const contenedor = mi_componente.elemento({
    tagName: "div",
    style: { display: "flex", gap: "10px" },
    childNodes: [
        boton, // El botón que creamos antes
        mi_componente.elemento({ tagName: "span", textContent: "Texto al lado" })
    ]
});
```

## API

### `crear_grupo()`
Crea un nuevo contexto de aislamiento. Devuelve un objeto con las siguientes funciones:

*   **`elemento(propiedades)`**: Crea un `HTMLElement` nativo.
    *   `tagName`: (Requerido) Tipo de etiqueta (div, span, button, etc.).
    *   `style`: Objeto con estilos en línea.
    *   `classList`: Lista, texto o objeto de clases.
        *   Lista: `["clase-a", "clase-b"]`
        *   Texto: `"clase-a clase-b"`
        *   Objeto: `{ "activa": true, "oculta": false }` (útil para clases condicionales)
    *   `dataset`: Objeto para atributos `data-*`.
    *   `childNodes`: Lista de nodos hijos (elementos, textos o números).
    *   Otras propiedades (`id`, `href`, `onclick`, etc.) se asignan directamente al elemento.

*   **`estilos(configuracion)`**: Inyecta CSS aislado en el documento.
    *   `reglas`: Objeto donde las claves son selectores CSS y los valores son objetos de estilo.
        *   Soporta anidamiento (Sass-like).
        *   Soporta `@media`, `@keyframes` (aislados automáticamente).
        *   Soporta `&` para referenciar al padre.

*   **`identificador_del_grupo`**: El UUID generado para este grupo.

*   **`recolectar_estilos_basura(configuracion)`**: Elimina estilos inyectados que ya no tienen elementos asociados en el DOM.
    *   Útil para SPAs o interfaces dinámicas donde se crean y destruyen grupos frecuentemente.
    *   Por defecto, la limpieza se programa para cuando el navegador esté inactivo (`requestIdleCallback`).
    *   `configuracion`: Objeto opcional.
        *   `de_inmediato`: (Boolean) Si es `true`, fuerza la limpieza síncrona inmediatamente.

## Ejemplos

Consulta la carpeta de `pruebas`.
