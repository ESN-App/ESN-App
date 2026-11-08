namespace EsnApp.Application.Settings;

public static class SiteSettingKeys
{
    public const string TimeZone = "timeZone";

    /// <summary>Used when the row is missing; the migration seeds the same value.</summary>
    public const string DefaultTimeZone = "Europe/Warsaw";
}
