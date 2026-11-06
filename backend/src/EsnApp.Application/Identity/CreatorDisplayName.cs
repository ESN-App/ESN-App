namespace EsnApp.Application.Identity;

public static class CreatorDisplayName
{
    /// <summary>
    /// "Jan" + "Kowalski" -> "Jan K."; only one name -> that name; no names -> the email's
    /// local part (accounts created before names existed); nothing at all -> null.
    /// </summary>
    public static string? Format(string? firstName, string? lastName, string? email)
    {
        var first = firstName?.Trim();
        var last = lastName?.Trim();

        if (!string.IsNullOrEmpty(first))
        {
            return string.IsNullOrEmpty(last) ? first : $"{first} {char.ToUpperInvariant(last[0])}.";
        }

        if (!string.IsNullOrEmpty(last))
        {
            return last;
        }

        var localPart = email?.Split('@')[0].Trim();
        return string.IsNullOrEmpty(localPart) ? null : localPart;
    }
}
