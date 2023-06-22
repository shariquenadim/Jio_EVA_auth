# Base image
FROM nginx:latest

# Copy Angular app files to the container
COPY dist/task /usr/share/nginx/html

# Expose the default port
EXPOSE 80

# Start the nginx server
CMD ["nginx", "-g", "daemon off;"]
