namespace EsnApp.Domain.Settings;

/// <summary>Site-wide string setting, keyed by name (not a BaseEntity: the key is the identity).</summary>
public class SiteSetting
{
    public string Key { get; set; } = string.Empty;

    public string Value { get; set; } = string.Empty;

    public DateTimeOffset UpdatedAt { get; set; }
}
