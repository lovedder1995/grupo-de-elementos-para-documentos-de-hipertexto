import recolectar_estilos_basura from "./utilidades/recolectar_estilos_basura.js"
/*
=========================================
= Estilos para documentos de hipertexto =
=========================================
*/
/*
----------------------
- Generar código CSS -
----------------------
*/
const generar_código_css = ({ reglas, identificador_del_grupo, global = false, ya_aislado = false, anidado = false }) => {
    if (typeof reglas !== "object" || reglas === null) {
        throw new Error("La lista («object») de reglas es obligatoria")
    }

    let css_generado = ""

    /* Procesamos cada regla */
    Object.keys(reglas).forEach(selector => {
        const contenido = reglas[selector]

        /*
        [ Bloques especiales (@media, @keyframes, etc.) ]
        */
        if (selector.startsWith("@")) {
            /* Reglas de una línea (@import) */
            if (typeof contenido === "string") {
                css_generado += `${selector} ${contenido};\n`
                return
            }
            /* Bloques de propiedades (@font-face) */
            if (selector.startsWith("@font-face") || selector.startsWith("@page")) {
                css_generado += `${selector} {\n${procesar_propiedades(contenido)}\n}\n`
                return
            }

            /* RECURSIÓN PARA EL CONTENIDO DEL BLOQUE */
            let cuerpo_bloque = ""

            /* Si estamos aislados o anidados (dentro de un selector), tratamos el contenido como cuerpo (propiedades + reglas) */
            if ((ya_aislado || anidado) && !selector.startsWith("@keyframes")) {
                cuerpo_bloque = generar_cuerpo_regla({
                    contenido,
                    identificador_del_grupo,
                    global: global || selector.startsWith("@keyframes"),
                    ya_aislado: ya_aislado || anidado
                })
            } else {
                cuerpo_bloque = generar_código_css({
                    reglas: contenido,
                    identificador_del_grupo,
                    global: global || selector.startsWith("@keyframes"),
                    ya_aislado: ya_aislado || anidado,
                    anidado: false // Reiniciamos anidado si es un bloque raíz (aunque raro dentro de recursión)
                })
            }

            css_generado += `${selector} {\n${cuerpo_bloque}\n}\n`
            return
        }

        /*
           TRANSFORMACIÓN DE SELECTORES E INYECCIÓN DE ID
        */
        let selector_final = selector
        let nuevo_ya_aislado = ya_aislado

        let modo_global_local = false
        if (!global && !ya_aislado) {
            // Verificamos si es un selector tipo ":global(body)" único
            if (selector.startsWith(":global(") && selector.endsWith(")")) {
                modo_global_local = true
            }
        }

        if (!global && !ya_aislado) {
            selector_final = dividir_selector(selector).map(parte => {
                parte = parte.trim()
                let parte_es_global = false

                // Desenvovler :global(...)
                while (parte.includes(":global(")) {
                    if (parte.startsWith(":global(") && parte.endsWith(")")) {
                        parte_es_global = true
                    }
                    // Nota: Esta sustitución sigue siendo simple y podría fallar con paréntesis anidados complejos dentro de :global
                    parte = parte.replace(/:global\(([^)]+)\)/, "$1")
                }

                if (parte.includes("&")) {
                    return parte.replace(/&/g, `[data-identificador-del-grupo="${identificador_del_grupo}"]`)
                }

                if (parte_es_global) {
                    return parte
                }

                return inyectar_id(parte, identificador_del_grupo)
            }).join(", ")

            nuevo_ya_aislado = true
        } else if (selector.startsWith(":global(") && selector.endsWith(")")) {
            selector_final = selector.slice(8, -1)
            modo_global_local = true
        }

        css_generado += `${selector_final} {\n`
        css_generado += generar_cuerpo_regla({
            contenido,
            identificador_del_grupo,
            global: global || modo_global_local, // Propagamos modo global si era :global() raíz
            ya_aislado: nuevo_ya_aislado
        })
        css_generado += "}\n"
    })

    return css_generado
}

/* Helper para generar el cuerpo (propiedades + subreglas) */
const generar_cuerpo_regla = ({ contenido, identificador_del_grupo, global, ya_aislado }) => {
    let css = ""
    const propiedades = {}
    const sub_reglas = {}
    let tiene_propiedades = false

    if (typeof contenido === "object") {
        Object.keys(contenido).forEach(clave => {
            const valor = contenido[clave]
            if (typeof valor !== "object" || Array.isArray(valor)) {
                propiedades[clave] = valor
                tiene_propiedades = true
            } else {
                sub_reglas[clave] = valor
            }
        })
    }

    if (tiene_propiedades) {
        css += procesar_propiedades(propiedades) + "\n"
    }

    if (Object.keys(sub_reglas).length > 0) {
        css += generar_código_css({
            reglas: sub_reglas,
            identificador_del_grupo,
            global,
            ya_aislado,
            anidado: true // Indicamos que estas sub-reglas están anidadas
        })
    }

    return css
}

/* Helper para formatear propiedades */
const procesar_propiedades = (propiedades) => {
    return Object.keys(propiedades).map(clave => {
        /* Kebab-case */
        const prop_kebab = clave.startsWith("--") ? clave : clave.replace(/[A-Z]/g, l => `-${l.toLowerCase()}`)

        /* Valores */
        let valores = Array.isArray(propiedades[clave]) ? propiedades[clave] : [propiedades[clave]]

        return valores.map(valor => `    ${prop_kebab}: ${valor};`).join("\n")
    }).join("\n")
}

/*
   Helpers de procesamiento de selectores
*/

/**
 * Divide un selector por comas, respetando comillas, paréntesis y corchetes.
 */
const dividir_selector = (selector) => {
    const partes = []
    let buffer = ""
    let parentesis = 0
    let corchetes = 0
    let comillas = null // null, '"' o "'"

    for (let i = 0; i < selector.length; i++) {
        const char = selector[i]

        if (comillas) {
            if (char === comillas && selector[i-1] !== "\\") {
                comillas = null
            }
        } else {
            if (char === "\"" || char === "'") {
                comillas = char
            } else if (char === "(") {
                parentesis++
            } else if (char === ")") {
                parentesis--
            } else if (char === "[") {
                corchetes++
            } else if (char === "]") {
                corchetes--
            } else if (char === "," && parentesis === 0 && corchetes === 0) {
                partes.push(buffer.trim())
                buffer = ""
                continue
            }
        }
        buffer += char
    }

    if (buffer.trim()) {
        partes.push(buffer.trim())
    }

    return partes
}

/**
 * Inyecta el atributo de ID en el primer selector compuesto válido,
 * respetando strings, paréntesis y evitando romper pseudo-elementos.
 */
const inyectar_id = (selector, id) => {
    const attr_selector = `[data-identificador-del-grupo="${id}"]`

    let parentesis = 0
    let corchetes = 0
    let comillas = null
    let boundary = selector.length
    let insertion_point = -1

    for (let i = 0; i < selector.length; i++) {
        const char = selector[i]

        if (comillas) {
            if (char === comillas && selector[i-1] !== "\\") {
                comillas = null
            }
        } else {
            if (char === "\"" || char === "'") {
                comillas = char
            } else if (char === "(") {
                parentesis++
            } else if (char === ")") {
                parentesis--
            } else if (char === "[") {
                corchetes++
            } else if (char === "]") {
                corchetes--
            } else {
                // Estado limpio
                if (parentesis === 0 && corchetes === 0) {
                    // Detectar combinadores: espacio, >, +, ~
                    if ([" ", ">", "+", "~"].includes(char)) {
                        boundary = i
                        break
                    }

                    // Detectar pseudo-elementos (::) para insertar ANTES
                    if (char === ":" && selector[i+1] === ":" && insertion_point === -1) {
                        insertion_point = i
                    }
                }
            }
        }
    }

    // Si no encontramos un lugar específico (::), insertamos al final del primer componente
    if (insertion_point === -1 || insertion_point > boundary) {
        insertion_point = boundary
    }

    return selector.slice(0, insertion_point) + attr_selector + selector.slice(insertion_point)
}

export default ({ reglas, identificador_del_grupo, global = false }) => {
/*
---------------------------------------
- Incorporar los estilos al documento -
---------------------------------------
*/
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
