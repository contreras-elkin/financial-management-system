# Financial Management System

Aplicación interna para que los trabajadores de una entidad financiera administren clientes, cuentas y transacciones.

## Despliegue en AWS

```
Navegador ──HTTPS──> CloudFront ──HTTP──> EC2 (docker compose)
                                           ├─ web: front + proxy /api
                                           ├─ api: Spring Boot
                                           └─ db:  PostgreSQL
```

- **CloudFront** recibe todo el tráfico, pone el HTTPS y cachea los archivos del front.
- **EC2** (`t3.micro`) ejecuta el mismo `docker-compose.yml` del proyecto más el override `docker-compose.prod.yml`, que usa las imágenes publicadas en GitHub Container Registry.
- La instancia solo acepta tráfico de CloudFront, no tiene SSH (se administra con Session Manager) y la base de datos no expone puertos.
- La infraestructura está definida en [`deploy/aws-stack.yml`](deploy/aws-stack.yml) (CloudFormation).

### Publicar una versión

1. Crear el tag de la versión en `main`. El workflow *Publish images* construye y publica las imágenes:

   ```bash
   git tag v0.1.0 && git push origin v0.1.0
   ```

2. **Primera vez:** crear la infraestructura. `AppVersion` y `GitRef` solo se usan al crear el stack.

   ```bash
   aws cloudformation deploy --stack-name fms --template-file deploy/aws-stack.yml \
     --capabilities CAPABILITY_IAM --parameter-overrides AppVersion=0.1.0 GitRef=v0.1.0
   ```

3. **Versiones siguientes:** entrar a la instancia con Session Manager y actualizar los contenedores:

   ```bash
   cd /opt/fms
   sudo git fetch --depth 1 origin tag v0.2.0 && sudo git checkout v0.2.0
   sudo sed -i 's/^APP_VERSION=.*/APP_VERSION=0.2.0/' .env
   sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
   sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

La URL de la aplicación se consulta en las salidas del stack (`Url`).

### Costo

Unos USD 12 al mes con la instancia encendida. Apagada, solo se pagan el disco y la IP elástica (unos USD 4 al mes) y se conservan la URL y los datos.

### Mejoras para producción

- Servir el front desde S3 detrás de CloudFront y dejar la EC2 solo con la API.
- Base de datos en RDS con respaldos automáticos y Multi-AZ.
- Cifrar el tramo CloudFront → EC2 y validar que el tráfico venga de nuestra distribución.
- Despliegue continuo: que el tag actualice la instancia automáticamente.
