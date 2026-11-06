namespace EsnApp.Domain.Features;

/// <summary>Runtime on/off switch, keyed by name (not a BaseEntity: the key is the identity).</summary>
public class FeatureFlag
{
    public string Key { get; set; } = string.Empty;

    public bool Enabled { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
