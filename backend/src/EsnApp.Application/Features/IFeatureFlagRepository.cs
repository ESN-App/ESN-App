using EsnApp.Domain.Features;

namespace EsnApp.Application.Features;

public interface IFeatureFlagRepository
{
    Task<IReadOnlyList<FeatureFlag>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<FeatureFlag?> GetByKeyAsync(string key, CancellationToken cancellationToken = default);

    Task<FeatureFlag> UpdateAsync(FeatureFlag flag, CancellationToken cancellationToken = default);
}
