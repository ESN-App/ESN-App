using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace EsnApp.Api.Tests;

public class VersionTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private WebApplicationFactory<Program> Factory(string? commit) => factory.WithWebHostBuilder(builder =>
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting(
            "ConnectionStrings:DefaultConnection",
            "Host=localhost;Port=5432;Database=esn_test;Username=esn;Password=placeholder");
        if (commit is not null)
        {
            builder.UseSetting("RENDER_GIT_COMMIT", commit);
        }
    });

    [Theory]
    [InlineData("0123456789abcdef0123456789abcdef01234567", "0123456789abcdef0123456789abcdef01234567")]
    [InlineData(null, "dev")]
    public async Task Get_Anonymous_ReturnsCommit(string? envCommit, string expected)
    {
        var response = await Factory(envCommit).CreateClient().GetAsync("/api/version");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<Body>();
        Assert.Equal(expected, body!.Commit);
        Assert.True(body.DeployedAt <= DateTimeOffset.UtcNow);
    }

    [Fact]
    public async Task Post_IsNotAllowed()
    {
        var response = await Factory(null).CreateClient().PostAsync("/api/version", null);

        Assert.Equal(HttpStatusCode.MethodNotAllowed, response.StatusCode);
    }

    private record Body(string Commit, DateTimeOffset DeployedAt);
}
