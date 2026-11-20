using EsnApp.Application.Identity;
using Microsoft.Extensions.Logging;

namespace EsnApp.Infrastructure.Identity;

public class LogEmailSender(ILogger<LogEmailSender> logger) : IEmailSender
{
    public Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Email logged, not sent. To: {ToEmail}, Subject: {Subject}, Body: {Body}", toEmail, subject, htmlBody);
        return Task.CompletedTask;
    }
}
