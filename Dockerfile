# Imagen base ligera con nginx
FROM nginx:alpine

# Eliminamos los archivos por defecto de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiamos tu aplicación estática (HTML, CSS, JS) al directorio que nginx sirve
COPY public/ /usr/share/nginx/html

# Crear y asignar permisos solo a directorios propios de nginx
RUN mkdir -p /var/cache/nginx /var/log/nginx /run/nginx && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /run/nginx && \
    sed -i 's|/run/nginx.pid|/run/nginx/nginx.pid|' /etc/nginx/nginx.conf

# Cambiar usuario por defecto
USER nginx

# Exponemos el puerto donde nginx servirá la app
EXPOSE 80

# nginx ya viene con el CMD configurado:
# CMD ["nginx", "-g", "daemon off;"]
