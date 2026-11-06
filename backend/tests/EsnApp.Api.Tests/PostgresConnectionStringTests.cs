using EsnApp.Infrastructure.Persistence;

namespace EsnApp.Api.Tests;

public class PostgresConnectionStringTests
{
    [Fact]
    public void Normalize_ConvertsRenderStyleUri()
    {
        var result = PostgresConnectionString.Normalize(
            "postgresql://esn:p%40ss%3Aword@dpg-abc123-a:5433/esn_gdansk");

        Assert.Equal(
            "Host=dpg-abc123-a;Port=5433;Database=esn_gdansk;Username=esn;Password=p@ss:word",
            result);
    }

    [Fact]
    public void Normalize_DefaultsPortAndMapsSslMode()
    {
        var result = PostgresConnectionString.Normalize(
            "postgres://esn:secret@db.example.com/esn?sslmode=require");

        Assert.Equal(
            "Host=db.example.com;Port=5432;Database=esn;Username=esn;Password=secret;SSL Mode=Require",
            result);
    }

    [Theory]
    [InlineData("Host=localhost;Port=5432;Database=esn;Username=esn;Password=x")]
    [InlineData("")]
    [InlineData(null)]
    public void Normalize_LeavesKeyValueStringsUntouched(string? input)
    {
        Assert.Equal(input, PostgresConnectionString.Normalize(input));
    }
}
