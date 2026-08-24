namespace EsnApp.Infrastructure.Identity;

public class EmailSettings
{
    public const string SectionName = "Email";

    public string SmtpHost { get; set; } = string.Empty;

    public int SmtpPort { get; set; } = 587;

    public string SmtpUsername { get; set; } = string.Empty;

    public string SmtpPassword { get; set; } = string.Empty;

    public string FromAddress { get; set; } = "no-reply@esngdansk.local";

    public string FromName { get; set; } = "ESN Gdańsk";

    public string FrontendBaseUrl { get; set; } = "http://localhost:4200";
}
