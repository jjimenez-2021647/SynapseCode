// Templates de "Hola Mundo" por lenguaje
export const codeTemplates = {
    JAVASCRIPT: {
        extension: 'js',
        template: `// Hola Mundo en JavaScript
console.log('¡Hola Mundo!');
`,
    },
    TYPESCRIPT: {
        extension: 'ts',
        template: `// Hola Mundo en TypeScript
console.log('¡Hola Mundo!');
`,
    },
    PYTHON: {
        extension: 'py',
        template: `# Hola Mundo en Python
print('¡Hola Mundo!')
`,
    },
    JAVA: {
        extension: 'java',
        template: `// Hola Mundo en Java
public class HolaMundo {
    public static void main(String[] args) {
        System.out.println("¡Hola Mundo!");
    }
}
`,
    },
    CSHARP: {
        extension: 'cs',
        template: `// Hola Mundo en C#
using System;

class Program {
    static void Main() {
        Console.WriteLine("¡Hola Mundo!");
    }
}
`,
    },
    CPLUSPLUS: {
        extension: 'cpp',
        template: `// Hola Mundo en C++
#include <iostream>
using namespace std;

int main() {
    cout << "¡Hola Mundo!" << endl;
    return 0;
}
`,
    },
    C: {
        extension: 'c',
        template: `// Hola Mundo en C
#include <stdio.h>

int main() {
    printf("¡Hola Mundo!\\n");
    return 0;
}
`,
    },
    PHP: {
        extension: 'php',
        template: `<?php
// Hola Mundo en PHP
echo "¡Hola Mundo!";
?>
`,
    },
    RUBY: {
        extension: 'rb',
        template: `# Hola Mundo en Ruby
puts "¡Hola Mundo!"
`,
    },
    GO: {
        extension: 'go',
        template: `package main

import "fmt"

func main() {
    fmt.Println("¡Hola Mundo!")
}
`,
    },
    RUST: {
        extension: 'rs',
        template: `// Hola Mundo en Rust
fn main() {
    println!("¡Hola Mundo!");
}
`,
    },
    KOTLIN: {
        extension: 'kt',
        template: `// Hola Mundo en Kotlin
fun main() {
    println("¡Hola Mundo!")
}
`,
    },
    SWIFT: {
        extension: 'swift',
        template: `// Hola Mundo en Swift
import Foundation

print("¡Hola Mundo!")
`,
    },
    OBJECTIVE_C: {
        extension: 'm',
        template: `// Hola Mundo en Objective-C
#import <Foundation/Foundation.h>

int main(int argc, char *argv[]) {
    @autoreleasepool {
        NSLog(@"¡Hola Mundo!");
    }
    return 0;
}
`,
    },
    SQL: {
        extension: 'sql',
        template: `-- Hola Mundo en SQL
SELECT 'Hola Mundo' AS mensaje;
`,
    },
    HTML: {
        extension: 'html',
        template: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hola Mundo</title>
</head>
<body>
    <h1>¡Hola Mundo!</h1>
</body>
</html>
`,
    },
    CSS: {
        extension: 'css',
        template: `/* Estilos CSS */
body {
    margin: 0;
    padding: 0;
}
`,
    },
    SCSS: {
        extension: 'scss',
        template: `// Estilos SCSS
$color: #333;

body {
    color: $color;
}
`,
    },
    LESS: {
        extension: 'less',
        template: `// Estilos LESS
@color: #333;

body {
    color: @color;
}
`,
    },
    JSON: {
        extension: 'json',
        template: `{
  "mensaje": "¡Hola Mundo!"
}
`,
    },
    XML: {
        extension: 'xml',
        template: `<?xml version="1.0" encoding="UTF-8"?>
<root>
    <mensaje>¡Hola Mundo!</mensaje>
</root>
`,
    },
    YAML: {
        extension: 'yaml',
        template: `# Configuración YAML
mensaje: ¡Hola Mundo!
`,
    },
    MARKDOWN: {
        extension: 'md',
        template: `# Hola Mundo

Este es un documento de ejemplo.
`,
    },
    BASH: {
        extension: 'sh',
        template: `#!/bin/bash
# Hola Mundo en Bash
echo "¡Hola Mundo!"
`,
    },
    POWERSHELL: {
        extension: 'ps1',
        template: `# Hola Mundo en PowerShell
Write-Host "¡Hola Mundo!"
`,
    },
    R: {
        extension: 'r',
        template: `# Hola Mundo en R
print("¡Hola Mundo!")
`,
    },
    PERL: {
        extension: 'pl',
        template: `#!/usr/bin/perl
# Hola Mundo en Perl
print "¡Hola Mundo!\\n";
`,
    },
    LUA: {
        extension: 'lua',
        template: `-- Hola Mundo en Lua
print("¡Hola Mundo!")
`,
    },
    GROOVY: {
        extension: 'groovy',
        template: `// Hola Mundo en Groovy
println "¡Hola Mundo!"
`,
    },
    DART: {
        extension: 'dart',
        template: `// Hola Mundo en Dart
void main() {
  print('¡Hola Mundo!');
}
`,
    },
    VB: {
        extension: 'vb',
        template: `' Hola Mundo en Visual Basic
Module HelloWorld
    Sub Main()
        Console.WriteLine("¡Hola Mundo!")
    End Sub
End Module
`,
    },
    SCALA: {
        extension: 'scala',
        template: `// Hola Mundo en Scala
object HelloWorld {
    def main(args: Array[String]): Unit = {
        println("¡Hola Mundo!")
    }
}
`,
    },
    CLOJURE: {
        extension: 'clj',
        template: `; Hola Mundo en Clojure
(println "¡Hola Mundo!")
`,
    },
    ELIXIR: {
        extension: 'ex',
        template: `# Hola Mundo en Elixir
IO.puts("¡Hola Mundo!")
`,
    },
    ERLANG: {
        extension: 'erl',
        template: `% Hola Mundo en Erlang
-module(hello).
-export([start/0]).

start() ->
    io:fwrite("¡Hola Mundo!~n").
`,
    },
    HASKELL: {
        extension: 'hs',
        template: `-- Hola Mundo en Haskell
main :: IO ()
main = putStrLn "¡Hola Mundo!"
`,
    },
    HTML_CSS: {
        extension: 'html',
        template: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hola Mundo</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        h1 {
            color: white;
            font-size: 3em;
        }
    </style>
</head>
<body>
    <h1>¡Hola Mundo!</h1>
</body>
</html>
`,
    },
}

// Mapeo de extensiones a lenguajes
export const extensionToLanguage = {
    js: 'JAVASCRIPT',
    ts: 'TYPESCRIPT',
    py: 'PYTHON',
    java: 'JAVA',
    cs: 'CSHARP',
    cpp: 'CPLUSPLUS',
    c: 'C',
    php: 'PHP',
    rb: 'RUBY',
    go: 'GO',
    rs: 'RUST',
    kt: 'KOTLIN',
    swift: 'SWIFT',
    m: 'OBJECTIVE_C',
    sql: 'SQL',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    less: 'LESS',
    json: 'JSON',
    xml: 'XML',
    yaml: 'YAML',
    md: 'MARKDOWN',
    sh: 'BASH',
    ps1: 'POWERSHELL',
    r: 'R',
    pl: 'PERL',
    lua: 'LUA',
    groovy: 'GROOVY',
    dart: 'DART',
    vb: 'VB',
    scala: 'SCALA',
    clj: 'CLOJURE',
    ex: 'ELIXIR',
    erl: 'ERLANG',
    hs: 'HASKELL',
}

// Obtener template por lenguaje
export const getTemplateByLanguage = (language) => {
    return codeTemplates[language] || codeTemplates.JAVASCRIPT
}

// Obtener lenguajes permitidos según configuración
export const getAllowedLanguages = (roomLanguage, multiLanguages = []) => {
    if (roomLanguage === 'MULTI' || multiLanguages.length > 0) {
        return multiLanguages.length > 0 ? multiLanguages : Object.keys(codeTemplates)
    }
    return roomLanguage ? [roomLanguage] : Object.keys(codeTemplates)
}

// Validar si una extensión es permitida
export const isExtensionAllowed = (extension, allowedLanguages) => {
    const language = extensionToLanguage[extension.toLowerCase()]
    return language && allowedLanguages.includes(language)
}

// Obtener extensiones permitidas
export const getAllowedExtensions = (allowedLanguages) => {
    const extensions = []
    Object.entries(extensionToLanguage).forEach(([ext, lang]) => {
        if (allowedLanguages.includes(lang) && !extensions.includes(ext)) {
            extensions.push(ext)
        }
    })
    return extensions
}
