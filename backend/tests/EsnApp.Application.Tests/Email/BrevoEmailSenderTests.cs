using System.Net;
using EsnApp.Infrastructure.Identity;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace EsnApp.Application.Tests.Email;

public class BrevoEmailSenderTests
{
    private sealed class FakeHandler(HttpStatusCode status) : HttpMessageHandler
    {
        public HttpRequestMessage? Request;
        public string? Body;

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Request = request;
            Body = await request.Content!.ReadAsStringAsync(ct);
            return new HttpResponseMessage(status);
        }
    }

    private static BrevoEmailSender Create(FakeHandler handler) => new(
        new HttpClient(handler),
        Options.Create(new EmailSettings { Brevo = { ApiKey = "secret" }, FromAddress = "a@b.c" }),
        NullLogger<BrevoEmailSender>.Instance);

    [Fact]
    public async Task Posts_expected_request()
    {
        var handler = new FakeHandler(HttpStatusCode.Created);
        await Create(handler).SendAsync("to@x.y", "Subj", "<p>Hi</p>");

        Assert.Equal("https://api.brevo.com/v3/smtp/email", handler.Request!.RequestUri!.ToString());
        Assert.Equal("secret", handler.Request.Headers.GetValues("api-key").Single());
        Assert.Contains("\"email\":\"to@x.y\"", handler.Body);
        Assert.Contains("\"subject\":\"Subj\"", handler.Body);
        Assert.Contains("\"htmlContent\":", handler.Body);
        Assert.Contains("\"textContent\":", handler.Body);
    }

    [Fact]
    public async Task Non_success_does_not_throw()
    {
        await Create(new FakeHandler(HttpStatusCode.Unauthorized)).SendAsync("to@x.y", "S", "b");
    }
}
