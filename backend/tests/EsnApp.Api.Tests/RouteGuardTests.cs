using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace EsnApp.Api.Tests;

public class RouteGuardTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private HttpClient Client() => factory.WithWebHostBuilder(builder =>
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting(
            "ConnectionStrings:DefaultConnection",
            "Host=localhost;Port=5432;Database=esn_test;Username=esn;Password=placeholder");
    }).CreateClient();

    private static readonly Guid Id = Guid.NewGuid();

    public static TheoryData<string, string> AdminRoutes => new()
    {
        { "GET", "/api/admin/events" }, { "GET", $"/api/admin/events/{Id}" },
        { "POST", "/api/admin/events" }, { "PUT", $"/api/admin/events/{Id}" },
        { "PATCH", $"/api/admin/events/{Id}" }, { "DELETE", $"/api/admin/events/{Id}" },
        { "GET", "/api/admin/news" }, { "POST", "/api/admin/news" },
        { "PUT", $"/api/admin/news/{Id}" }, { "PATCH", $"/api/admin/news/{Id}/status" },
        { "PUT", "/api/admin/news/order" }, { "DELETE", $"/api/admin/news/{Id}" },
        { "GET", "/api/admin/info" }, { "POST", "/api/admin/info" },
        { "PUT", $"/api/admin/info/{Id}" }, { "PATCH", $"/api/admin/info/{Id}/status" },
        { "PUT", "/api/admin/info/order" }, { "DELETE", $"/api/admin/info/{Id}" },
        { "GET", "/api/admin/partners" }, { "POST", "/api/admin/partners" },
        { "PUT", $"/api/admin/partners/{Id}" }, { "PATCH", $"/api/admin/partners/{Id}/status" },
        { "PUT", "/api/admin/partners/order" }, { "DELETE", $"/api/admin/partners/{Id}" },
        { "GET", "/api/admin/discounts" }, { "POST", "/api/admin/discounts" },
        { "PUT", $"/api/admin/discounts/{Id}" }, { "DELETE", $"/api/admin/discounts/{Id}" },
        { "GET", "/api/admin/admins" }, { "POST", "/api/admin/admins" },
        { "DELETE", $"/api/admin/admins/{Id}" }, { "POST", $"/api/admin/admins/{Id}/reset-password" },
        { "GET", "/api/admin/settings" }, { "PUT", "/api/admin/settings" },
        { "GET", "/api/admin/features" }, { "PUT", "/api/admin/features/any" },
    };

    [Theory]
    [MemberData(nameof(AdminRoutes))]
    public async Task AdminRoute_Anonymous_Returns401(string method, string url)
    {
        var response = await Client().SendAsync(new HttpRequestMessage(new HttpMethod(method), url));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData("POST")]
    [InlineData("PUT")]
    [InlineData("PATCH")]
    [InlineData("DELETE")]
    public async Task PublicCollection_NonGetVerb_IsRejected(string method)
    {
        var client = Client();
        foreach (var path in new[] { "events", "info", "news", "partners", "discounts", "settings", "features" })
        {
            var response = await client.SendAsync(new HttpRequestMessage(new HttpMethod(method), $"/api/{path}"));

            Assert.True(
                response.StatusCode is HttpStatusCode.MethodNotAllowed or HttpStatusCode.NotFound,
                $"{method} /api/{path} returned {(int)response.StatusCode}");
        }
    }

    [Fact]
    public async Task PublicItemRoute_Delete_IsRejected()
    {
        var response = await Client().DeleteAsync($"/api/events/{Id}");

        Assert.True(response.StatusCode is HttpStatusCode.MethodNotAllowed or HttpStatusCode.NotFound);
    }
}
