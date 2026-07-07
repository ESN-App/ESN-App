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
}
