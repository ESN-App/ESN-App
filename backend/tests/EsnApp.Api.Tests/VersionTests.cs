using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace EsnApp.Api.Tests;

public class VersionTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    // The app runs in-process, so its base directory is the test output directory.
    private static readonly string VersionFile = Path.Combine(AppContext.BaseDirectory, "VERSION");

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

    [Fact]
    public async Task Get_WithCommitAndVersionFile_ReturnsBoth()
    {
        const string sha = "0123456789abcdef0123456789abcdef01234567";
        await File.WriteAllTextAsync(VersionFile, "0.3.20\n");
        try
        {
            var body = await GetVersion(sha);

            Assert.Equal("0.3.20", body.Version);
            Assert.Equal(sha, body.Commit);
            Assert.True(body.DeployedAt <= DateTimeOffset.UtcNow);
        }
        finally
        {
            File.Delete(VersionFile);
        }
    }

    [Fact]
    public async Task Get_WithoutCommitOrVersionFile_ReturnsDev()
    {
        var body = await GetVersion(null);

        Assert.Equal("dev", body.Version);
        Assert.Equal("dev", body.Commit);
    }

    [Fact]
    public async Task Post_IsNotAllowed()
    {
        var response = await Factory(null).CreateClient().PostAsync("/api/version", null);

        Assert.Equal(HttpStatusCode.MethodNotAllowed, response.StatusCode);
    }

    private async Task<Body> GetVersion(string? commit)
    {
        var response = await Factory(commit).CreateClient().GetAsync("/api/version");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<Body>())!;
    }

    private record Body(string Version, string Commit, DateTimeOffset DeployedAt);
}
