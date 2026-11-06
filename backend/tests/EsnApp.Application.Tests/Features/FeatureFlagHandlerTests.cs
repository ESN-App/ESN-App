using EsnApp.Application.Features;
using EsnApp.Domain.Features;

namespace EsnApp.Application.Tests.Features;

public class FeatureFlagHandlerTests
{
    [Fact]
    public async Task Update_KnownKey_TogglesFlag()
    {
        var flag = new FeatureFlag { Key = FeatureFlagKeys.PastEventTag, Enabled = true };
        var handler = new UpdateFeatureFlagCommandHandler(new FakeFeatureFlagRepository(flag));

        var result = await handler.Handle(
            new UpdateFeatureFlagCommand(FeatureFlagKeys.PastEventTag, false), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.False(result.Value!.Enabled);
        Assert.False(flag.Enabled);
        Assert.NotEqual(default, flag.UpdatedAt);
    }

    [Fact]
    public async Task Update_UnknownKey_ReturnsFailure()
    {
        // A stray row in the DB is still not toggleable unless the key is known.
        var stray = new FeatureFlag { Key = "x", Enabled = false };
        var handler = new UpdateFeatureFlagCommandHandler(new FakeFeatureFlagRepository(stray));

        var result = await handler.Handle(new UpdateFeatureFlagCommand("x", true), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.False(stray.Enabled);
    }

    [Fact]
    public async Task GetPublic_ReturnsOnlyKnownKeys()
    {
        var handler = new GetFeatureFlagsQueryHandler(new FakeFeatureFlagRepository(
            new FeatureFlag { Key = FeatureFlagKeys.PastEventTag, Enabled = true },
            new FeatureFlag { Key = "removedFlag", Enabled = true }));

        var result = await handler.Handle(new GetFeatureFlagsQuery(), CancellationToken.None);

        Assert.Equal(new Dictionary<string, bool> { [FeatureFlagKeys.PastEventTag] = true }, result.Value);
    }

    private sealed class FakeFeatureFlagRepository(params FeatureFlag[] flags) : IFeatureFlagRepository
    {
        public Task<IReadOnlyList<FeatureFlag>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<FeatureFlag>>(flags);

        public Task<FeatureFlag?> GetByKeyAsync(string key, CancellationToken cancellationToken = default) =>
            Task.FromResult(flags.FirstOrDefault(flag => flag.Key == key));

        public Task<FeatureFlag> UpdateAsync(FeatureFlag flag, CancellationToken cancellationToken = default) =>
            Task.FromResult(flag);
    }
}
