using Npgsql;

namespace EsnApp.Infrastructure.Persistence;

/// <summary>
/// Accepts both Npgsql key=value connection strings and postgres:// / postgresql:// URIs
/// (the format hosting providers such as Render hand out), which Npgsql cannot parse itself.
/// </summary>
public static class PostgresConnectionString
{
    public static string? Normalize(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString)
            || !(connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
                || connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)))
        {
            return connectionString;
        }

        var uri = new Uri(connectionString);
        var userInfo = uri.UserInfo.Split(':', 2);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort || uri.Port <= 0 ? 5432 : uri.Port,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            Username = Uri.UnescapeDataString(userInfo[0]),
        };

        if (userInfo.Length > 1)
        {
            builder.Password = Uri.UnescapeDataString(userInfo[1]);
        }

        // shortcut: only ?sslmode= is mapped from the query string, other URI options are ignored; extend if a provider needs them.
        foreach (var pair in uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = pair.Split('=', 2);
            if (parts.Length == 2 && parts[0].Equals("sslmode", StringComparison.OrdinalIgnoreCase))
            {
                builder.SslMode = Enum.Parse<SslMode>(Uri.UnescapeDataString(parts[1]).Replace("-", ""), ignoreCase: true);
            }
        }

        return builder.ConnectionString;
    }
}
