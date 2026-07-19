# Build context: repository root (see docker-compose.yml)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first so dependency layers are cached between builds
COPY backend/EsnApp.sln backend/
COPY backend/src/EsnApp.Domain/EsnApp.Domain.csproj backend/src/EsnApp.Domain/
COPY backend/src/EsnApp.Application/EsnApp.Application.csproj backend/src/EsnApp.Application/
COPY backend/src/EsnApp.Infrastructure/EsnApp.Infrastructure.csproj backend/src/EsnApp.Infrastructure/
COPY backend/src/EsnApp.Api/EsnApp.Api.csproj backend/src/EsnApp.Api/
COPY backend/tests/EsnApp.Application.Tests/EsnApp.Application.Tests.csproj backend/tests/EsnApp.Application.Tests/
COPY backend/tests/EsnApp.Api.Tests/EsnApp.Api.Tests.csproj backend/tests/EsnApp.Api.Tests/
RUN dotnet restore backend/EsnApp.sln

COPY backend/ backend/
RUN dotnet publish backend/src/EsnApp.Api/EsnApp.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "EsnApp.Api.dll"]
