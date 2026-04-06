#!/bin/bash
# Hook PostToolUse: registra en CONTEXT.md los ficheros modificados durante la sesión

CONTEXT_FILE="/Users/dariodelapoza/Documents/Proyectos/coinsDDLP_v2.0/CONTEXT.md"
LOG_FILE="/Users/dariodelapoza/Documents/Proyectos/coinsDDLP_v2.0/.claude/session-changes.log"

# Leer el input JSON del hook desde stdin
INPUT=$(cat)

# Extraer la herramienta y el fichero modificado
TOOL=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_name',''))" 2>/dev/null)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); inp=d.get('tool_input',{}); print(inp.get('file_path', inp.get('file_path','')))" 2>/dev/null)

# Solo registrar ficheros dentro del proyecto coinsDDLP_v2.0 (excluir el propio CONTEXT.md y logs)
if [[ "$FILE_PATH" == *"coinsDDLP_v2.0"* ]] && \
   [[ "$FILE_PATH" != *"CONTEXT.md"* ]] && \
   [[ "$FILE_PATH" != *".claude/"* ]] && \
   [[ -n "$FILE_PATH" ]]; then

  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  SHORT_PATH=$(echo "$FILE_PATH" | sed 's|.*/coinsDDLP_v2.0/||')

  # Registrar en el log de sesión
  echo "$TIMESTAMP | $TOOL | $SHORT_PATH" >> "$LOG_FILE"

  # Actualizar la línea "Última actualización" en CONTEXT.md
  TODAY=$(date '+%Y-%m-%d')
  sed -i '' "s|> \*\*Última actualización:\*\* .*|> **Última actualización:** $TODAY|" "$CONTEXT_FILE"
fi
