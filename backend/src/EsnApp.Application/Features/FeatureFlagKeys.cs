namespace EsnApp.Application.Features;

/// <summary>The only flags that exist. Removing one = delete it here + a migration dropping its row.</summary>
public static class FeatureFlagKeys
{
    // shortcut: pastEventTag is temporary (#33 "Mark past events"), remove once the tag is permanent.
    public const string PastEventTag = "pastEventTag";

    public static readonly IReadOnlySet<string> All = new HashSet<string> { PastEventTag };
}
