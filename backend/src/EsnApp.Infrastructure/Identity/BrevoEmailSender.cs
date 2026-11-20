using System.Net.Http.Json;
using System.Text.RegularExpressions;
using EsnApp.Application.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EsnApp.Infrastructure.Identity;

/// <summary>Sends email through the Brevo transactional API (HTTPS, works where SMTP is blocked).</summary>
public class BrevoEmailSender(
    HttpClient http,
    IOptions<EmailSettings> options,
    ILogger<BrevoEmailSender> logger) : IEmailSender
{
    private const string Url = "https://api.brevo.com/v3/smtp/email";
    private readonly EmailSettings _settings = options.Value;

    public async Task SendAsync(
        string toEmail,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.Brevo.ApiKey))
        {
            logger.LogInformation(
                "No Brevo API key configured; logging email instead of sending it. To: {ToEmail}, Subject: {Subject}, Body: {Body}",
                toEmail, subject, htmlBody);
            return;
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, Url)
        {
            Content = JsonContent.Create(new
            {
                sender = new { name = _settings.FromName, email = _settings.FromAddress },
                to = new[] { new { email = toEmail } },
                subject,
                htmlContent = htmlBody,
                textContent = Regex.Replace(htmlBody, "<[^>]+>", " "),
            }),
        };
        request.Headers.Add("api-key", _settings.Brevo.ApiKey);

        try
        {
            using var response = await http.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Brevo email send failed with status {StatusCode}", (int)response.StatusCode);
            }
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning("Brevo email send failed: {Message}", ex.Message);
        }
    }
}
