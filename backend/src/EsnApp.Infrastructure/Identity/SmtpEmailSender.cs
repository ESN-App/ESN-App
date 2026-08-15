using EsnApp.Application.Identity;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace EsnApp.Infrastructure.Identity;

public class SmtpEmailSender(
    IOptions<EmailSettings> options,
    ILogger<SmtpEmailSender> logger) : IEmailSender
{
    private readonly EmailSettings _settings = options.Value;

    public async Task SendAsync(
        string toEmail,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.SmtpHost))
        {
            logger.LogInformation(
                "No SMTP host configured; logging email instead of sending it. To: {ToEmail}, Subject: {Subject}, Body: {Body}",
                toEmail,
                subject,
                htmlBody);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(
            _settings.SmtpHost,
            _settings.SmtpPort,
            SecureSocketOptions.StartTls,
            cancellationToken);

        if (!string.IsNullOrWhiteSpace(_settings.SmtpUsername))
        {
            await client.AuthenticateAsync(_settings.SmtpUsername, _settings.SmtpPassword, cancellationToken);
        }

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }
}
