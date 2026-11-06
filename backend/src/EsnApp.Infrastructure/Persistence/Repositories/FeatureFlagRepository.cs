using EsnApp.Application.Features;
using EsnApp.Domain.Features;
using Microsoft.EntityFrameworkCore;

namespace EsnApp.Infrastructure.Persistence.Repositories;

public class FeatureFlagRepository(AppDbContext context) : IFeatureFlagRepository
{
    public async Task<IReadOnlyList<FeatureFlag>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await context.FeatureFlags.AsNoTracking().OrderBy(flag => flag.Key).ToListAsync(cancellationToken);

    public async Task<FeatureFlag?> GetByKeyAsync(string key, CancellationToken cancellationToken = default) =>
        await context.FeatureFlags.AsNoTracking().FirstOrDefaultAsync(flag => flag.Key == key, cancellationToken);

    public async Task<FeatureFlag> UpdateAsync(FeatureFlag flag, CancellationToken cancellationToken = default)
    {
        context.FeatureFlags.Update(flag);
        await context.SaveChangesAsync(cancellationToken);
        return flag;
    }
}
