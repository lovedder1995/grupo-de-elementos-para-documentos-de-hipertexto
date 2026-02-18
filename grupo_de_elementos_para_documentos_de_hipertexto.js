import elemento from "./fuente/elemento_para_documentos_de_hipertexto.js"
import estilos from "./fuente/estilos_para_documentos_de_hipertexto.js"
import recolectar_estilos_basura from "./fuente/utilidades/recolectar_estilos_basura.js"
/*
====================================================
= Grupo de elementos para documentos de hipertexto =
====================================================
*/

let contador_de_grupos = 0

/* Así creamos un grupo de elementos: */ export default () => {

    /* Primero, le creamos un identificador único al grupo. */ const identificador = contador_de_grupos++

    /* Finalmente, devolvemos las herramientas disponibles para este grupo. */
    return {
        identificador,
        recolectar_estilos_basura,
        elemento: (propiedades) => elemento({ propiedades, identificador_del_grupo: identificador }),
        estilos: (reglas) => estilos({ reglas, identificador_del_grupo: identificador })
    }
}
