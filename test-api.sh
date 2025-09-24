#!/bin/bash

# Script de pruebas completo del API
echo "🧪 Iniciando pruebas completas del API"
echo "======================================"

API_URL="https://ue-descubre.vercel.app"

echo ""
echo "1️⃣  Test básico de conectividad"
echo "--------------------------------"
curl -s -w "Status: %{http_code} | Time: %{time_total}s\n" $API_URL/ > /dev/null

echo ""
echo "2️⃣  Health Check"
echo "----------------"
curl -s $API_URL/api/health | jq '.status, .mongodb, .session'

echo ""
echo "3️⃣  Debug de variables de entorno"
echo "----------------------------------"
curl -s $API_URL/api/debug/env | jq '.data | {nodeEnv, hasMongoUri, dbName, hasSessionSecret}'

echo ""
echo "4️⃣  Test de autenticación"
echo "-------------------------"
echo "Login correcto:"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"AdminCambiar123!"}' \
  -c /tmp/cookies.txt)

echo $LOGIN_RESPONSE | jq '.success, .message, .data.username, .data.role'

echo ""
echo "Login incorrecto:"
curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrong"}' | jq '.success, .message'

echo ""
echo "5️⃣  Test de verificación de sesión"
echo "-----------------------------------"
curl -s $API_URL/api/auth/verify -b /tmp/cookies.txt | jq '.success, .authenticated, .data.username'

echo ""
echo "6️⃣  Test de endpoints protegidos"
echo "---------------------------------"
echo "Estadísticas (con auth):"
curl -s $API_URL/api/estadisticas -b /tmp/cookies.txt | jq '.success, .data.totalEstudiantes'

echo ""
echo "Estadísticas (sin auth):"
curl -s $API_URL/api/estadisticas | jq '.success, .message'

echo ""
echo "7️⃣  Test de estudiantes"
echo "-----------------------"
echo "Listar estudiantes (con auth):"
curl -s $API_URL/api/estudiantes -b /tmp/cookies.txt | jq '.success, .message // .data[0].nombre // "Sin datos"'

echo ""
echo "Registro estudiante (público):"
curl -s -X POST $API_URL/api/estudiantes/registro \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test API Usuario",
    "email": "test@example.com",
    "telefono": "3001234567",
    "resultado": {
      "archetypeId": 1,
      "programa": "Test Program",
      "compatibilidad": 90
    }
  }' | jq '.success, .message'

echo ""
echo "8️⃣  Test de rate limiting"
echo "-------------------------"
echo "Intentos múltiples de login:"
for i in {1..3}; do
  RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}')
  echo "Intento $i: $(echo $RESPONSE | jq -r '.message')"
done

echo ""
echo "9️⃣  Test de endpoints no existentes"
echo "------------------------------------"
curl -s $API_URL/api/nonexistent | jq '.success, .message'

echo ""
echo "🏁 Pruebas completadas"
echo "======================"

# Limpiar archivos temporales
rm -f /tmp/cookies.txt