/*
=========================================
= Estilos para documentos de hipertexto =
=========================================
*/

/*
------------------------------------
- Utilidad: Separación de selectores -
------------------------------------
*/
/* Esta función separa selectores por comas, pero respeta las comas que estén dentro de paréntesis o comillas. */
const separar_selectores = (selector_completo) => {
    const selectores = []
    let buffer = ""
    let parentesis_nivel = 0
    let comilla = null // null, '"', o "'"

    for (let i = 0; i < selector_completo.length; i++) {
        const char = selector_completo[i]

        /* Manejo de comillas */
        if (char === "\"" || char === "'") {
            if (comilla === char) {
                /* Cerramos comilla */
                comilla = null
            } else if (comilla === null) {
                /* Abrimos comilla */
                comilla = char
            }
        }

        /* Manejo de paréntesis (solo si no estamos dentro de comillas) */
        if (comilla === null) {
            if (char === "(") parentesis_nivel++
            if (char === ")") parentesis_nivel--
        }

        /* Detección de coma separadora */
        if (char === "," && parentesis_nivel === 0 && comilla === null) {
            selectores.push(buffer.trim())
            buffer = ""
        } else {
            buffer += char
        }
    }

    /* Agregamos el último fragmento */
    if (buffer.trim()) {
        selectores.push(buffer.trim())
    }

    return selectores
}

/*
-------------------------
- Generar el código CSS -
-------------------------
*/
/* Para generar el código CSS, */ const generar_css = ({ reglas, identificador_del_grupo, selector_padre: selector_anterior = "", global = false }) => {
    /* primero necesitamos recibir un lista de reglas. */ if (typeof reglas !== "object" || reglas === null) {
        /* Si no lo recibimos, lanzamos un error. */ throw new Error("La lista («object») de reglas es obligatoria") }

    /* Teniendo la lista de reglas, podemos empezar a generar el código. */ let css_generado = ""

    /*
    [ Escaneo de animaciones locales ]
    Antes de procesar nada, buscamos si hay @keyframes definidos en este nivel
    para poder reemplazar sus nombres y referencias automáticamente.
    */
    const animaciones_locales = []
    if (!global) { // Solo si estamos en modo aislado
        Object.keys(reglas).forEach(clave => {
            if (clave.startsWith("@keyframes ")) {
                const nombre_animacion = clave.replace("@keyframes ", "").trim()
                /* Si el nombre usa :global(), NO lo consideramos local (no se renombrará). */
                if (!nombre_animacion.startsWith(":global(") || !nombre_animacion.endsWith(")")) {
                    animaciones_locales.push(nombre_animacion)
                }
            }
        })
    }

    /* En cada regla, */ Object.keys(reglas).forEach(selector_del_elemento_o_condición_recibido => {
        /* Obtenemos el contenido de la regla. */
        const contenido = reglas[selector_del_elemento_o_condición_recibido]

        /* esperamos recibir un selector de un elemento o condición. */ let selector_del_elemento_o_condición = selector_del_elemento_o_condición_recibido

        /*
        [ Bloques especiales (@media, @keyframes, @import, etc.) ]
        */
        /* Si el selector es un bloque de control (empieza con @), debemos tratarlo de forma especial: */
        if (selector_del_elemento_o_condición_recibido.startsWith("@")) {
            /* Caso especial: Reglas de una sola línea (@import, @charset, @namespace) que tienen valor de texto directo. */
            if (typeof contenido === "string") {
                css_generado += `${selector_del_elemento_o_condición_recibido} ${contenido};\n`
                return
            }

            /* Caso especial: Bloques que contienen propiedades directas (@font-face, @page), no selectores anidados. */
            if (selector_del_elemento_o_condición_recibido.startsWith("@font-face") || selector_del_elemento_o_condición_recibido.startsWith("@page")) {
                const propiedades = Object.keys(contenido).map(prop => {
                    return `${prop.replace(/[A-Z]/g, letra => `-${letra.toLowerCase()}`)}: ${contenido[prop]};`
                }).join("\n    ")
                css_generado += `${selector_del_elemento_o_condición_recibido} {\n    ${propiedades}\n}\n`
                return
            }

            /* Caso especial: Animaciones (@keyframes) */
            /* Si estamos aislando (!global) y es un keyframe local que hemos detectado, le añadimos el sufijo único. */
            let selector_bloque = selector_del_elemento_o_condición_recibido
            if (selector_bloque.startsWith("@keyframes ")) {
                const nombre_original = selector_bloque.replace("@keyframes ", "").trim()

                /* Si usa :global(), le quitamos el envoltorio y NO añadimos sufijo. */
                if (nombre_original.startsWith(":global(") && nombre_original.endsWith(")")) {
                    selector_bloque = `@keyframes ${nombre_original.slice(8, -1)}`
                }
                /* Si no es global y está en nuestra lista de locales, le añadimos el sufijo. */
                else if (!global && animaciones_locales.includes(nombre_original)) {
                    selector_bloque = `@keyframes ${nombre_original}-${identificador_del_grupo}`
                }
            }

            /* 1. Generamos el contenido interno recursivamente, pero SIN pasarle el selector padre actual
               (para que las reglas internas no se concatenen erróneamente al @media).
               Si estamos dentro de un selector, ese contexto se pierde visualmente en la sintaxis anidada de CSS puro
               a menos que usemos la técnica de burbujeo, pero por ahora lo tratamos como bloque aislado. */

            /* Corrección: Si es un @media, SÍ queremos pasarle el contexto del selector padre actual
               para que las reglas dentro del media query sigan aplicando al elemento correcto.
               Pero, como el bloque @media interrumpe la cadena de selectores, debemos "burbujear"
               el selector padre hacia adentro de las reglas del media query.

               Estrategia: No pasamos selector_padre, pero modificamos las reglas internas.
               Si el selector padre existe (ej: .caja), y tenemos:
               .caja {
                   @media (...) {
                       backgroundColor: red;
                   }
               }

               Esto debe convertirse en:
               @media (...) {
                   .caja { backgroundColor: red; }
               }

               Por lo tanto, si tenemos un selector padre activo, debemos envolver las propiedades
               internas dentro de una regla que use ese selector padre.
            */

            let reglas_a_procesar = contenido

            /* Si estamos dentro de un selector (selector_anterior existe) y el bloque es un @media (u otro condicional de grupo),
               debemos inyectar el selector padre en las reglas internas que sean propiedades directas. */
            if (selector_anterior && !selector_del_elemento_o_condición_recibido.startsWith("@keyframes")) {
                const nuevas_reglas = {}
                const propiedades_directas = {}
                let tiene_propiedades = false

                Object.keys(contenido).forEach(clave => {
                    const valor = contenido[clave]
                    /* Si es una propiedad (string, number, array) */
                    if (typeof valor !== "object" || Array.isArray(valor)) {
                        propiedades_directas[clave] = valor
                        tiene_propiedades = true
                    } else {
                        /* Si es un objeto anidado (otro selector), lo mantenemos igual */
                        nuevas_reglas[clave] = valor
                    }
                })

                /* Si había propiedades directas (ej: background-color), las metemos dentro de una regla con el selector padre "&" */
                if (tiene_propiedades) {
                    nuevas_reglas["&"] = propiedades_directas
                }

                reglas_a_procesar = nuevas_reglas
            }

            const css_interno = generar_css({
                reglas: reglas_a_procesar,
                identificador_del_grupo,
                selector_padre: selector_anterior, // Pasamos el padre para que los "&" se resuelvan
                global: global || selector_del_elemento_o_condición_recibido.startsWith("@keyframes")
            })

            /* 2. Envolvemos el resultado en un bloque con llaves. */
            css_generado += `${selector_bloque} {\n${css_interno}}\n`

            /* Terminamos aquí para esta iteración, ya que el bloque @ se maneja por su cuenta. */
            return
        }

        /*
        [ Aislamiento ]
        */
        /* La intención de los grupos es mantener los estilos aislados, */ if (
            /* pero si queremos, podemos marcar los estilos como «globales» para aplicarlos a todo el documento. */ !global) {
            /* lo incluimos en su grupo. */
            /* Si hay múltiples selectores separados por comas, debemos aislar cada uno. */
            selector_del_elemento_o_condición = separar_selectores(selector_del_elemento_o_condición).map(selector_individual => {
                const selector_limpio = selector_individual.trim()

                /* Comprobamos si el selector usa :global() para escapar del aislamiento. */
                if (selector_limpio.startsWith(":global(") && selector_limpio.endsWith(")")) {
                    /* Extraemos el contenido dentro de :global(...) y lo devolvemos tal cual, sin atributo de datos. */
                    return selector_limpio.slice(8, -1)
                }

                /* Si ya venimos de un selector padre, el aislamiento ya está aplicado en la cadena,
                   así que no necesitamos aplicarlo de nuevo a este nivel. */
                if (selector_anterior) {
                    return selector_limpio
                }

                /* Si es un selector raíz, aplicamos el aislamiento dual para cubrir tanto
                   el elemento raíz del componente como sus descendientes internos. */

                /* Corrección para pseudo-elementos (::before, ::after):
                   El atributo de datos debe ir ANTES del pseudo-elemento, no después.
                   Ej: "div::before" -> "div[data-id]::before", NO "div::before[data-id]" */
                let selector_con_atributo
                const indice_pseudo = selector_limpio.indexOf("::")

                if (indice_pseudo >= 0) {
                    selector_con_atributo = selector_limpio.slice(0, indice_pseudo) +
                                            `[data-identificador-del-grupo="${identificador_del_grupo}"]` +
                                            selector_limpio.slice(indice_pseudo)
                } else {
                    selector_con_atributo = `${selector_limpio}[data-identificador-del-grupo="${identificador_del_grupo}"]`
                }

                return `${selector_con_atributo}, [data-identificador-del-grupo="${identificador_del_grupo}"] ${selector_limpio}`
            }).join(", ")
        }
        /*
        [ Anidamiento ]
        */
        /* Podemos seleccionar un elemento y elegir si queremos que el elemento anterior */ if (selector_anterior) {
            /* sea el padre. */
            /* Si el padre o el hijo tienen selectores múltiples (comas), debemos combinarlos todos contra todos (producto cartesiano). */
            const padres = separar_selectores(selector_anterior).map(p => p.trim())
            const actuales = separar_selectores(selector_del_elemento_o_condición).map(c => c.trim())

            const combinados = []

            padres.forEach(padre => {
                actuales.forEach(actual => {
                    /* Si el selector actual tiene un ampersand (&), lo reemplazamos con el padre. */
                    if (actual.includes("&")) {
                        combinados.push(actual.replace(/&/g, padre))
                    }
                    /* Si no, simplemente concatenamos con un espacio (descendiente). */
                    else {
                        combinados.push(`${padre} ${actual}`)
                    }
                })
            })

            selector_del_elemento_o_condición = combinados.join(", ")
        }

        /* Si el contenido es un objeto, significa que hay reglas anidadas o propiedades. */
        if (typeof contenido === "object") {
            /* Verificamos si parece ser un bloque de propiedades CSS o más selectores anidados. */
            /* Si las claves parecen propiedades (no empiezan con puntos, almohadillas, etc), las procesamos como bloque. */
            /* Simplificación: Asumimos que si tiene propiedades de estilo, es un bloque. */

            /* Separamos las propiedades CSS de los selectores anidados. */
            const propiedades = []
            const anidados = {}

            Object.keys(contenido).forEach(clave => {
                const valor = contenido[clave]

                /* Si es un objeto y NO es un array, es un selector anidado. */
                if (typeof valor === "object" && !Array.isArray(valor)) {
                    anidados[clave] = valor
                } else {
                    /* Convertimos la clave de camelCase a kebab-case y guardamos la propiedad. */
                    /* EXCEPCIÓN: Las variables CSS (--variable) son case-sensitive y no deben transformarse. */
                    const propiedad_kebab = clave.startsWith("--")
                        ? clave
                        : clave.replace(/[A-Z]/g, letra => `-${letra.toLowerCase()}`)

                    /* Preparamos una lista de valores (si es un array, usamos sus elementos; si no, el valor único). */
                    const valores = Array.isArray(valor) ? valor : [valor]

                    valores.forEach(valor_crudo => {
                        let valor_final = valor_crudo

                        /* Si la propiedad es animation o animation-name, buscamos si usa una animación local. */
                        if ((propiedad_kebab === "animation" || propiedad_kebab === "animation-name") && !global) {
                            animaciones_locales.forEach(nombre_local => {
                                /* Reemplazamos el nombre de la animación solo si aparece como palabra completa. */
                                /* Usamos una expresión regular con límites de palabra (\b) para no reemplazar coincidencias parciales. */
                                const regex = new RegExp(`\\b${nombre_local}\\b`, "g")
                                if (regex.test(valor_final)) {
                                    valor_final = valor_final.replace(regex, `${nombre_local}-${identificador_del_grupo}`)
                                }
                            })
                        }

                        propiedades.push(`${propiedad_kebab}: ${valor_final};`)
                    })
                }
            })

            /* Si encontramos propiedades, generamos la regla CSS. */
            if (propiedades.length > 0) {
                css_generado += `${selector_del_elemento_o_condición} {\n    ${propiedades.join("\n    ")}\n}\n`
            }

            /* Si encontramos selectores anidados, los procesamos recursivamente. */
            if (Object.keys(anidados).length > 0) {
                css_generado += generar_css({ reglas: anidados, identificador_del_grupo, selector_padre: selector_del_elemento_o_condición, global })
            }
        }
    })

    /* Devolvemos todo el CSS acumulado. */
    return css_generado
}

/*
---------------------------------------
- Incorporar los estilos al documento -
---------------------------------------
*/
import recolectar_estilos_basura from "./recolectar_estilos_basura.js"

export { recolectar_estilos_basura }

export default ({ reglas, identificador_del_grupo, textoPlano = false, global = false }) => {
    /* Generamos el CSS en formato de texto a partir de las reglas recibidas. */
    /* Si es global, no aplicamos el aislamiento por defecto en el selector raíz, aunque la lógica interna trata de aplicarlo si no se especifica lo contrario. */
    /* Ajustamos la lógica: si es global, pasamos false a usar_aislamiento. */
    const css_compilado = generar_css({ reglas, identificador_del_grupo, selector_padre: "", global })

    /* Si se solicitó solo el texto, lo devolvemos. */
    if (textoPlano) {
        return css_compilado
    }

    /* Si no, creamos una etiqueta <style> y la inyectamos en el encabezado del documento. */
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
