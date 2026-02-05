/*
---------------------------------------
- Recolección de Basura (Garbage Collection) -
---------------------------------------
*/
/* Usamos una bandera para evitar programar múltiples limpiezas simultáneas. */
let hay_una_limpieza_pendiente = false
let id_de_limpieza_programada = null

const programar_limpieza = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000))
const cancelar_limpieza = window.cancelIdleCallback || clearTimeout

const limpiar_estilos_huerfanos = () => {
    /* Buscamos todas las etiquetas <style> que pertenezcan a nuestra librería (tienen id que empieza por "estilos-"). */
    const estilos_existentes = document.querySelectorAll("style[id^=\"estilos-\"]")

    estilos_existentes.forEach(style => {
        /* Extraemos el ID del grupo de la etiqueta de estilo. */
        const id_grupo = style.id.replace("estilos-", "")

        /* Buscamos si queda algún elemento vivo en el DOM que pertenezca a este grupo. */
        const existe_uso = document.querySelector(`[data-identificador-del-grupo="${id_grupo}"]`)

        /* Si no encontramos ningún elemento usándolo, asumimos que el grupo ha muerto y borramos sus estilos. */
        if (!existe_uso) {
            style.remove()
        }
    })

    /* Al terminar, liberamos la bandera para permitir futuras limpiezas. */
    hay_una_limpieza_pendiente = false
    id_de_limpieza_programada = null
}

export default (configuración = {}) => {
    /* Si se solicita una limpieza inmediata (ej: al cerrar un modal crítico),
       cancelamos cualquier espera y ejecutamos ya. */
    if (configuración.de_inmediato) {
        if (hay_una_limpieza_pendiente && id_de_limpieza_programada) {
            cancelar_limpieza(id_de_limpieza_programada)
        }
        limpiar_estilos_huerfanos()
        return
    }

    /* Programamos una limpieza para cuando el navegador esté ocioso.
       Esto evita bloquear el hilo principal y da tiempo a que los elementos recién creados se monten en el DOM.
       Solo programamos si no hay ya una pendiente. */
    if (!hay_una_limpieza_pendiente) {
        hay_una_limpieza_pendiente = true
        id_de_limpieza_programada = programar_limpieza(limpiar_estilos_huerfanos)
    }
}
