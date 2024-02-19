# FROM node:18.15.0-alpine
# WORKDIR /usr/src/app
# COPY package*.json ./
# RUN npm install
# COPY . .
# EXPOSE 3000
# CMD ["node", "server.js"]

# Use your custom PostGIS image as the base image
FROM gquathamer/denver-parcels

COPY ./setup.sh /usr/setup.sh

# Run necessary commands to create a database table
#RUN /usr/setup.sh

# Copy the backup file into the container


# Optionally, you can include additional commands or customization steps here
# For example, setting environment variables or copying files

# Expose any ports if needed
EXPOSE 5432:5432

# Define any default command to run when the container starts
CMD ["bash", "usr/setup.sh"]
