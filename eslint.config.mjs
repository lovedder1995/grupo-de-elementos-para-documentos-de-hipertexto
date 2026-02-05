import js from "eslint-js-autocontenido"
import stylistic from "stylistic-eslint-plugin-autocontenido"
import globals from "globals"

export default [
    /* Usamos la configuración recomendada */ js.configs.recommended,
    {
        /* Analizamos los archivos con extensión */ files:
        ["**/*.js", /* y */ "**/*.mjs"],

        /* El código */ languageOptions: {
        /* debe ser JavaScript moderno */ ecmaVersion: "latest", sourceType: "module",

            /* Tomamos en cuenta las variables */ globals: {
            /* del navegador, */ ...globals.browser,
                /* Node */ ...globals.node,
                /* y Bun */ Bun: "readonly"
            }
        },
        /* Extensiones: */ plugins: {
            /* - Para el formato del código, */ "@stylistic":
            /* usamos */ stylistic
        },
        /* Reglas: */ rules: {
            /* - Los archivos siempre deben terminar con una línea vacía */ "@stylistic/eol-last": "error",
            /* - No se deben usar tabuladores, solo espacios. */ "@stylistic/no-tabs": "error",
            /* - No debe haber espacios en blanco al final de las líneas */ "@stylistic/no-trailing-spaces": "error",
            /* - La sangría se debe hacer de 4 en 4 espacios */ "@stylistic/indent": ["error", 4],
            /* - Los textos deben ser formados con comillas dobles */ "@stylistic/quotes": ["error", "double"],
            /* - No se deben usar puntos y comas al final de las líneas */ "@stylistic/semi": ["error", "never"],
            /* - El útlimo elemento de una lista no debe tener una coma al final */ "@stylistic/comma-dangle": ["error", "never"]
        }
    }
]
