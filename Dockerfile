FROM oven/bun:1
WORKDIR /app
COPY . .

RUN bun install

RUN bun run build.ts
 
ARG PORT
EXPOSE ${PORT:-3000}
 
CMD ["bun", "index.ts"]
