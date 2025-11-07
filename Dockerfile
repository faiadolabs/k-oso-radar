# Imagen base ligera con nginx
FROM nginx:alpine

# Eliminamos los archivos por defecto de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiamos tu aplicación estática (HTML, CSS, JS) al directorio que nginx sirve
COPY public/ /usr/share/nginx/html

# Ajustar permisos para el usuario nginx
RUN chown -R nginx:nginx /usr/share/nginx/html

# Cambiar usuario por defecto
USER nginx

# Exponemos el puerto donde nginx servirá la app
EXPOSE 80

# nginx ya viene con el CMD configurado:
# CMD ["nginx", "-g", "daemon off;"]
