/*
=========================================
= Estilos para documentos de hipertexto =
=========================================
*/

import generar_código_css from "./utilidades/generar_codigo_css.js"
import recolectar_estilos_basura from "./utilidades/recolectar_estilos_basura.js"

/*
---------------------------------------
- Incorporar los estilos al documento -
---------------------------------------
*/

export { recolectar_estilos_basura }

export default ({ reglas, identificador_del_grupo, global = false }) => {
    /* Generamos el CSS en formato de texto a partir de las reglas recibidas. */
    /* Si es global, no aplicamos el aislamiento por defecto en el selector raíz, aunque la lógica interna trata de aplicarlo si no se especifica lo contrario. */
    /* Ajustamos la lógica: si es global, pasamos false a usar_aislamiento. */
    const css_compilado = generar_código_css({ reglas, identificador_del_grupo, selector_padre: "", global })

    /* Creamos una etiqueta <style> y la inyectamos en el encabezado del documento. */
    const etiqueta_style = document.createElement("style")
    /* Le asignamos un ID único para poder identificarla y gestionarla después. */
    etiqueta_style.id = `estilos-${identificador_del_grupo}`
    etiqueta_style.textContent = css_compilado
    document.head.appendChild(etiqueta_style)

    /*
    [ Recolección de Basura (Garbage Collection) ]
    Programamos una limpieza para cuando el navegador esté ocioso.
    Esto evita bloquear el hilo principal y da tiempo a que los elementos recién creados se monten en el DOM.
    Solo programamos si no hay ya una pendiente.
    */
    recolectar_estilos_basura()

    /* Devolvemos el texto generado por si acaso. */
    return css_compilado
}
