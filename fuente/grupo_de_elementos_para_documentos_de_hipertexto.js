import elemento from "./elemento_para_documentos_de_hipertexto.js"
import estilos from "./estilos_para_documentos_de_hipertexto.js"
import recolectar_estilos_basura from "./recolectar_estilos_basura.js"

/* Así creamos un grupo de elementos: */ export default () => {

    /* Primero, le creamos un identificador único al grupo. */ const identificador_del_grupo = crypto.randomUUID()

    /* Finalmente, devolvemos las herramientas disponibles para este grupo. */
    return {
        identificador_del_grupo,
        recolectar_estilos_basura,
        elemento: (propiedades) => elemento({ propiedades, identificador_del_grupo }),
        estilos: (propiedades) => estilos({ ...propiedades, identificador_del_grupo })
    }
}
