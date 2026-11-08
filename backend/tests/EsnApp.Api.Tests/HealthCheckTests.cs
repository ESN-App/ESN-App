using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace EsnApp.Api.Tests;

public class HealthCheckTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private WebApplicationFactory<Program> Factory => factory.WithWebHostBuilder(builder =>
    {
        builder.UseEnvironment("Testing");

        // A syntactically valid connection string; no connection is opened by these tests.
        builder.UseSetting(
            "ConnectionStrings:DefaultConnection",
            "Host=localhost;Port=5432;Database=esn_test;Username=esn;Password=placeholder");
    });

    [Fact]
    public async Task HealthEndpoint_ReturnsOk()
    {
        var client = Factory.CreateClient();

        var response = await client.GetAsync("/health");

        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task SwaggerDocument_ReturnsOk()
    {
        var client = Factory.CreateClient();

        var response = await client.GetAsync("/swagger/v1/swagger.json");

        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task AdminFeatureUpdate_Anonymous_ReturnsUnauthorized()
    {
        var client = Factory.CreateClient();

        var response = await client.PutAsJsonAsync("/api/admin/features/x", new { enabled = true });

        Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AdminSettingsUpdate_Anonymous_ReturnsUnauthorized()
    {
        var client = Factory.CreateClient();

        var response = await client.PutAsJsonAsync("/api/admin/settings", new { timeZone = "Europe/Warsaw" });

        Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task PublicSettings_Put_IsNotAllowed()
    {
        var client = Factory.CreateClient();

        var response = await client.PutAsJsonAsync("/api/settings", new { timeZone = "Europe/Warsaw" });

        Assert.Equal(System.Net.HttpStatusCode.MethodNotAllowed, response.StatusCode);
    }
}
