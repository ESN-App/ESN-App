using EsnApp.Application.Settings;
using EsnApp.Domain.Settings;

namespace EsnApp.Application.Tests.Settings;

public class SiteSettingsHandlerTests
{
    [Fact]
    public async Task Get_MissingRow_ReturnsDefaultTimeZone()
    {
        var handler = new GetSiteSettingsQueryHandler(new FakeSiteSettingRepository());

        var result = await handler.Handle(new GetSiteSettingsQuery(), CancellationToken.None);

        Assert.Equal("Europe/Warsaw", result.Value!.TimeZone);
    }

    [Fact]
    public async Task Update_ValidTimeZone_IsStoredAndReturned()
    {
        var repository = new FakeSiteSettingRepository();
        var command = new UpdateSiteSettingsCommand("America/New_York");
        Assert.True(new UpdateSiteSettingsCommandValidator().Validate(command).IsValid);

        var result = await new UpdateSiteSettingsCommandHandler(repository).Handle(command, CancellationToken.None);
        var read = await new GetSiteSettingsQueryHandler(repository).Handle(new GetSiteSettingsQuery(), CancellationToken.None);

        Assert.Equal("America/New_York", result.Value!.TimeZone);
        Assert.Equal("America/New_York", read.Value!.TimeZone);
    }

    [Theory]
    [InlineData("")]
    [InlineData("Mars/Olympus_Mons")]
    [InlineData("Central European Standard Time")]
    public void Validator_InvalidTimeZone_Fails(string timeZone)
    {
        var result = new UpdateSiteSettingsCommandValidator().Validate(new UpdateSiteSettingsCommand(timeZone));

        Assert.False(result.IsValid);
    }

    private sealed class FakeSiteSettingRepository : ISiteSettingRepository
    {
        private readonly Dictionary<string, SiteSetting> _settings = new();

        public Task<SiteSetting?> GetByKeyAsync(string key, CancellationToken cancellationToken = default) =>
            Task.FromResult(_settings.GetValueOrDefault(key));

        public Task<SiteSetting> UpsertAsync(SiteSetting setting, CancellationToken cancellationToken = default)
        {
            _settings[setting.Key] = setting;
            return Task.FromResult(setting);
        }
    }
}
