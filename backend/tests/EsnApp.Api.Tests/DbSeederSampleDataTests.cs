using EsnApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace EsnApp.Api.Tests;

/// <summary>The context points at an unreachable DB: a skipped seed never touches it, a real seed has to.</summary>
public class DbSeederSampleDataTests
{
    private static AppDbContext Context() => new(
        new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=127.0.0.1;Port=1;Database=unused;Username=unused;Password=unused;Timeout=1")
            .Options,
        null);

    private static IConfiguration Config(string? value) => new ConfigurationBuilder()
        .AddInMemoryCollection(value is null ? [] : new Dictionary<string, string?> { ["Seed:SampleData"] = value })
        .Build();

    [Theory]
    [InlineData(null)]
    [InlineData("false")]
    public async Task FlagOff_SkipsSampleData(string? value)
    {
        using var context = Context();
        await DbSeeder.SeedSampleDataAsync(context, Config(value));
    }

    [Fact]
    public async Task FlagOn_SeedsSampleData()
    {
        using var context = Context();
        await Assert.ThrowsAnyAsync<Exception>(() => DbSeeder.SeedSampleDataAsync(context, Config("true")));
    }
}
