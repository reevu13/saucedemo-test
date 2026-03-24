# Use the official Microsoft Playwright image based on Ubuntu Jammy
# Matching the @playwright/test version from package.json
FROM mcr.microsoft.com/playwright:v1.58.2-jammy

# Set the working directory inside the container
WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* ./

# Install project dependencies cleanly
RUN npm ci

# Copy the rest of the project files
COPY . .

# Set environment variables standard for CI checks
ENV CI=true

# Specify the default command to run test suite (can be overridden)
CMD ["npm", "test"]
